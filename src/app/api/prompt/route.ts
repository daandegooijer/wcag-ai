import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    // Craft the prompt for WCAG compliance check with a focus on actionable improvements
    const prompt = `You are an accessibility expert. Review the following HTML content for WCAG (Web Content Accessibility Guidelines) compliance.

Note: The content may include HTML, including images. Only mention color or contrast issues if such information is explicitly present in the text or HTML. For any <img> tags, check if the filename is descriptive and if the alt attribute is meaningful and helpful for accessibility. Point out any images with missing, empty, or non-descriptive alt tags or filenames.

For your response, provide:
- A clear, structured list of all accessibility issues you find, with a short explanation and a concrete example or pointer for each.
- A list of at least 3 actionable, specific suggestions for improvement (especially for text and images), each with a brief rationale and, if possible, a rewritten example. Focus on what the user can do to make the text and images better for accessibility. For images, always suggest a concrete improved alt text and filename if needed.
- Any additional ideas or best practices that could further enhance accessibility, even if not strictly required by WCAG.

Format your response as:
Issues:
1. ...
2. ...
Suggestions:
1. ...
2. ...
3. ...
Ideas:
1. ...
2. ...

Be as specific, practical, and improvement-focused as possible. Use clear, concise language. Prioritize actionable advice in the Suggestions section.

HTML to review:
"""${text}"""`;

    // Call OpenAI API with a short timeout and faster model
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
    const aiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // more accurate, better for accessibility analysis
        messages: [
          {
            role: "system",
            content:
              "You are an expert accessibility consultant specializing in WCAG and web best practices. Always provide clear, actionable, and user-friendly feedback, focusing on practical improvements for both text and images.",
          },
          { role: "user", content: prompt },
        ],
        // max_tokens: 250, // lower for faster response
        temperature: 0, // deterministic output for consistency
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!aiRes.ok) {
      return NextResponse.json({ error: "AI service error." }, { status: 500 });
    }
    const aiData = await aiRes.json();

    let feedback =
      aiData.choices?.[0]?.message?.content || "No feedback received.";

    // Markdown to HTML helper (basic)
    function markdownToHtml(md: string): string {
      return md
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
        .replace(/`([^`]+)`/g, "<code>$1</code>") // inline code
        .replace(/^### (.*)$/gm, "<h3>$1</h3>") // h3
        .replace(/^## (.*)$/gm, "<h2>$1</h2>") // h2
        .replace(/^# (.*)$/gm, "<h1>$1</h1>"); // h1
    }

    // Try to split feedback into issues, suggestions, and ideas, and format as grouped HTML lists
    let html = "";
    const issueRegex =
      /(?:issues?|problems?|concerns?):?([\s\S]*?)(?:suggestions?|improvements?|recommendations?|ideas?:)/i;
    const suggestionRegex =
      /(?:suggestions?|improvements?|recommendations?):?([\s\S]*?)(?:ideas?:|$)/i;
    const ideasRegex = /(?:ideas?:)([\s\S]*)/i;
    const issuesMatch = feedback.match(issueRegex);
    const suggestionsMatch = feedback.match(suggestionRegex);
    const ideasMatch = feedback.match(ideasRegex);
    // Split before markdown conversion for best results
    const issues = issuesMatch
      ? issuesMatch[1]
          .trim()
          .split(/\n+|\d+\.\s+/)
          .filter(Boolean)
      : [];
    let suggestions = suggestionsMatch
      ? suggestionsMatch[1]
          .trim()
          .split(/\n+|\d+\.\s+/)
          .filter(Boolean)
      : [];
    const ideas = ideasMatch
      ? ideasMatch[1]
          .trim()
          .split(/\n+|\d+\.\s+/)
          .filter(Boolean)
      : [];
    // Convert each item to HTML after splitting
    const issuesHtml = issues.map(markdownToHtml);
    let suggestionsHtml = suggestions.map(markdownToHtml);
    const ideasHtml = ideas.map(markdownToHtml);

    // If the input HTML contains <img> tags, show their alt and a suggested alt next to the image in suggestions
    const imgTagRegex =
      /<img\s+[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi;
    const imgSuggestions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = imgTagRegex.exec(text)) !== null) {
      const src = match[1];
      const alt = match[2];
      imgSuggestions.push(
        `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">` +
          `<img src="${src}" alt="${alt}" style="max-width:80px;border:1px solid #ddd;" />` +
          `<div><div style="font-size:13px;"><strong>Current alt:</strong> <span style="color:#dc2626;">${
            alt ? alt : "(empty)"
          }</span></div>` +
          `<div style="font-size:13px;"><strong>Suggested alt:</strong> <span style="color:#059669;">Describe the image meaningfully for accessibility</span></div></div></div>`
      );
    }
    if (imgSuggestions.length) {
      suggestionsHtml = imgSuggestions.concat(suggestionsHtml);
    }

    if (issuesHtml.length || suggestionsHtml.length || ideasHtml.length) {
      if (issuesHtml.length) {
        html +=
          '<div style="margin-bottom:8px;"><strong style="color:#dc2626;">Issues:</strong><ul style="list-style: disc inside; padding-left: 1em; color:#dc2626;">';
        issuesHtml.forEach((item: string) => {
          html += `<li>${item}</li>`;
        });
        html += "</ul></div>";
      }
      if (suggestionsHtml.length) {
        html +=
          '<div style="margin-bottom:8px;"><strong style="color:#2563eb;">Suggestions:</strong><ul style="list-style: disc inside; padding-left: 1em; color:#2563eb;">';
        suggestionsHtml.forEach((item: string) => {
          if (item.startsWith("<div")) {
            html += `<li style=\"list-style:none;\">${item}</li>`;
          } else {
            html += `<li>${item}</li>`;
          }
        });
        html += "</ul></div>";
      }
      if (ideasHtml.length) {
        html +=
          '<div style="margin-bottom:8px;"><strong style="color:#059669;">Ideas:</strong><ul style="list-style: disc inside; padding-left: 1em; color:#059669;">';
        ideasHtml.forEach((item: string) => {
          html += `<li>${item}</li>`;
        });
        html += "</ul></div>";
      }
    } else {
      // fallback: wrap feedback in a blue box
      html = `<div style=\"background:#eff6ff;color:#2563eb;padding:1em;border-radius:8px;\">${feedback}</div>`;
    }

    return NextResponse.json({ feedback: html });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
