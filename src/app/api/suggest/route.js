import OpenAI from "openai";

function repairTruncatedJson(text) {
  let json = text.match(/\{[\s\S]*/)?.[0];
  if (!json) return null;

  try {
    return JSON.parse(json);
  } catch {}

  const stack = [];
  let inString = false;
  let escaped = false;
  let lastValidEnd = 0;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    if (ch === "}" || ch === "]") stack.pop();
    if (stack.length === 0) { lastValidEnd = i + 1; break; }
  }

  if (lastValidEnd > 0) {
    try { return JSON.parse(json.slice(0, lastValidEnd)); } catch {}
  }

  let repaired = json;
  while (stack.length > 0) {
    const open = stack.pop();
    repaired += open === "{" ? "}" : "]";
  }

  const cleanups = [
    repaired,
    repaired.replace(/,\s*([}\]])/g, "$1"),
    repaired.replace(/,\s*$/, "") + "]}",
  ];

  for (const attempt of cleanups) {
    try { return JSON.parse(attempt); } catch {}
  }

  return null;
}

export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const body = await request.json();
    const { latitude, longitude, query, exclude } = body;

    if (!query && (!latitude || !longitude)) {
      return Response.json(
        { error: "Provide a search query or location coordinates" },
        { status: 400 }
      );
    }

    const locationContext = query
      ? `The user wants to explore "${query}".`
      : `The user is at coordinates (${latitude}, ${longitude}).`;

    const excludeNote = exclude?.length
      ? `\nDo NOT include these places (already suggested): ${exclude.join(", ")}.`
      : "";

    const prompt = `You are a top-tier travel content creator like kk.creates — known for cinematic storytelling, personal voiceovers, and reels that feel authentic, not like ads. ${locationContext}

Suggest 5 specific, photogenic sub-locations great for vlogging.${excludeNote}

IMPORTANT — Write vlog content that stops the scroll. Be SPECIFIC and CREATIVE.

OPENING HOOK (first 3–5 seconds — must be QUIRKY and scroll-stopping):
- Be weird, funny, or oddly specific. The hook should make someone laugh, squint, or immediately need to know the story.
- Use ONE of these QUIRKY patterns (vary by place, never repeat the same vibe twice):
  • Absurd specificity: "This chai costs 7 rupees and emotionally healed me." / "I found a staircase that smells like 1920."
  • Mini-drama: "I got lost for 40 minutes. Best mistake of my life." / "The shopkeeper told me to leave. Then he showed me the roof."
  • Unhinged opinion: "This sunset is aggressively beautiful and I'm upset about it." / "I think this alley just flirted with me."
  • Accidental discovery: "I was looking for a bathroom and found the most cinematic spot in the city." / "Google Maps said 'road closed.' I climbed the fence."
  • Quirky confession: "I talked to a stray cat here for 10 minutes. No regrets." / "I'm not crying, this temple just has really aggressive vibes."
  • Anti-travel-influencer: "No one's posing here. That's how you know it's good." / "Zero Instagram spots. Infinite character."
  • Deadpan / dry humour: "This is objectively the best wall in this city. I'll explain." / "Rated this place 11/10. The pigeons agree."
- NEVER generic ("Top 5 places", "You need to visit", "This place is amazing"). If the hook could apply to any place in the world, rewrite it. It must be specific to THIS place.

REEL SCRIPT (30 seconds — beat-by-beat, creative and trend-aware):
- Structure with EXACT creative beats (write the actual words for each beat):
  • [0–3s] HOOK: One of the patterns above — exact line to say or show as text. No filler.
  • [3–8s] TEASE: Show the place without naming it. One surprising detail or feeling. "You don't get it until you're here."
  • [8–18s] REVEAL + STORY: Name the place. One short story (mistake, surprise, or "I thought X but Y"). One sensory or emotional punch line.
  • [18–25s] PAYOFF: Best visual or moment (golden hour, one dish, one corner). "This is the shot that broke my camera roll."
  • [25–30s] CTA: Not "follow for more." Use: "Save this for when you're in [city]." / "Tag someone who needs to see this." / "Reply with your favourite spot and I'll go next."
- Vary format: sometimes voiceover, sometimes text-on-screen, sometimes no words and let the clip breathe. Include one specific "silence or music drop" moment where you write: [MUSIC DROP – no voice, 2s].
- Reference a trending angle when it fits: "Get ready with me but for sunrise at [place]," "Things that just make sense in [city]," "No one talks about this part."

SCRIPT (full voiceover): Keep first-person, conversational, one budget or practical tip, one emotional beat. Same creative energy as hook and reel.

Return ONLY valid JSON (no markdown):
{
  "area_name": "City/Region",
  "area_vibe": "One-line poetic vibe",
  "places": [
    {
      "name": "Place Name",
      "type": "temple|cafe|park|market|monument|museum|nature|viewpoint|street|beach|lake|other",
      "lat": 26.9239,
      "lng": 75.8267,
      "distance": "~X km from center",
      "description": "2 sentence vivid description",
      "image_query": "stock photo search terms for this place",
      "vlog_ideas": [
        {
          "title": "Catchy vlog title",
          "hook": "EXACT quirky 5-sec opening line — funny, oddly specific, or slightly unhinged. Must be specific to THIS place.",
          "script": "Full 60-90 sec voiceover in first person. One emotional beat, one practical tip, conversational.",
          "reel_script": "Beat-by-beat 30-sec script with [0-3s], [3-8s], [8-18s], [18-25s], [25-30s]. Write the actual lines and include one [MUSIC DROP] moment. Creative and trend-aware.",
          "shots": ["Cinematic shot with camera movement", "Shot 2", "Shot 3", "Shot 4", "Shot 5"],
          "music_vibe": "lo-fi chill / dramatic cinematic / upbeat travel",
          "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
        }
      ],
      "quick_tips": ["Tip 1", "Tip 2"],
      "best_time": "Best time to film"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write quirky, slightly unhinged, oddly specific travel hooks that make people laugh or squint. Your tone is dry humour meets genuine wonder — like a funny friend who accidentally finds beautiful places. You never sound like a travel influencer. Hooks are weird, personal, and specific to the place. Reel scripts have exact beat-by-beat lines and at least one music-drop moment. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = repairTruncatedJson(content);
      if (!parsed) {
        throw new Error("Failed to parse AI response");
      }
    }

    if (parsed.places) {
      parsed.places = parsed.places.filter(
        (p) => p.name && p.type && p.description
      );
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("API Error:", error);

    if (error?.status === 429 || error?.code === "insufficient_quota") {
      return Response.json(
        {
          error:
            "OpenAI API quota exceeded. Please add billing credits at platform.openai.com/settings/organization/billing",
        },
        { status: 429 }
      );
    }

    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
