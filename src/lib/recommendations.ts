import { Novel, NovelPreference } from '@/types/chat';
import { openai } from './openai';
import { getNovelCache } from './redis';

const SYSTEM_PROMPT = `You are a novel recommendation expert. Analyze the user's preferences and extract key features they're looking for in a novel. 
Return a JSON object with the following structure:
{
  "genres": ["genre1", "genre2"],
  "tags": ["tag1", "tag2"],
  "mood": ["mood1", "mood2"],
  "status": "ONGOING" | "COMPLETED" | "ON HOLD" | "CANCELLED" | "UPCOMING",
  "type": "Web Novel" | "Light Novel" | "Novel",
  "seriesType": "ORIGINAL" | "TRANSLATED" | "FAN_FIC",
  "minRating": number,
  "excludedGenres": ["genre1", "genre2"],
  "excludedTags": ["tag1", "tag2"],
  "availability": "FREE" | "FREEMIUM" | "PAID"
}

Focus on:
- Genres they mention
- Themes or tags they're interested in
- The mood they're looking for
- Any specific requirements (status, type, etc.)
- What they want to avoid

Only include fields that are explicitly mentioned or can be clearly inferred from the user's request.`;

export async function extractPreferences(userInput: string): Promise<NovelPreference> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput }
      ],
      model: "gpt-4",
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    try {
      return JSON.parse(response || '{}') as NovelPreference;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Fallback to basic preferences if parsing fails
      return {
        genres: [userInput.toLowerCase()],
      };
    }
  } catch (error) {
    console.error('Error extracting preferences:', error);
    // Fallback to basic preferences if API call fails
    return {
      genres: [userInput.toLowerCase()],
    };
  }
}

export function scoreNovel(novel: Novel, preferences: NovelPreference): number {
  let score = 0;
  const weights = {
    genre: 3,
    tags: 2,
    status: 1.5,
    type: 1,
    rating: 1
  };

  // Match genres
  if (preferences.genres) {
    const matchedGenres = novel.genres.filter(g => 
      preferences.genres?.some(pg => 
        g.name.toLowerCase().includes(pg.toLowerCase())
      )
    ).length;
    score += (matchedGenres / (preferences.genres.length || 1)) * weights.genre;
  }

  // Match tags
  if (preferences.tags) {
    const matchedTags = novel.tags.filter(t => 
      preferences.tags?.some(pt => t.toLowerCase().includes(pt.toLowerCase()))
    ).length;
    score += (matchedTags / (preferences.tags.length || 1)) * weights.tags;
  }

  // Check status
  if (preferences.status && novel.seriesStatus === preferences.status) {
    score += weights.status;
  }

  // Check type
  if (preferences.type && novel.chapterType === preferences.type) {
    score += weights.type;
  }

  // Consider rating
  if (preferences.minRating && novel.rating >= preferences.minRating) {
    score += weights.rating;
  }

  // Apply penalties for excluded content
  if (preferences.excludedGenres) {
    const hasExcludedGenre = novel.genres.some(g => 
      preferences.excludedGenres?.some(eg =>
        g.name.toLowerCase().includes(eg.toLowerCase())
      )
    );
    if (hasExcludedGenre) score -= 5;
  }

  if (preferences.excludedTags) {
    const hasExcludedTag = novel.tags.some(t => 
      preferences.excludedTags?.some(et => t.toLowerCase().includes(et.toLowerCase()))
    );
    if (hasExcludedTag) score -= 5;
  }

  return score;
}

export async function getRecommendations(
  preferences: NovelPreference,
  limit: number = 5
): Promise<Novel[]> {
  try {
    const novels = await getNovelCache();
    if (!novels || !Array.isArray(novels) || novels.length === 0) {
      console.error('No novels found in cache or invalid data format');
      return [];
    }

    // Validate each novel object
    const validNovels = novels.filter(novel => {
      return (
        novel &&
        typeof novel === 'object' &&
        'novelId' in novel &&
        'title' in novel &&
        'genres' in novel &&
        Array.isArray(novel.genres) &&
        'tags' in novel &&
        Array.isArray(novel.tags)
      );
    });

    if (validNovels.length === 0) {
      console.error('No valid novels found after validation');
      return [];
    }

    const scoredNovels = validNovels
      .map(novel => ({
        novel,
        score: scoreNovel(novel, preferences)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredNovels.map(({ novel }) => novel);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

export async function generateExplanation(
  recommendations: Novel[],
  preferences: NovelPreference
): Promise<string> {
  const prompt = `Based on the user's preferences:
${JSON.stringify(preferences, null, 2)}

I recommended these novels:
${recommendations.map(n => n.title).join(', ')}

Generate a brief, friendly explanation of why these novels match their preferences. Keep it under 100 words.`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: "gpt-4",
    max_tokens: 150,
    temperature: 0.7,
  });

  return completion.choices[0].message.content || '';
} 