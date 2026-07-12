<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# give me the steps /codes and  implementation instructions to build within my web-based application the ability to create an AI 20 second movie clip, selecting from the attached AI styles, and tell me which API i need to connect to. I want to create an advertisment app that allows users the ability to QUICKLY select a few things based on a limited set of design choices and the app configures it (they get 4 retries after the initial try); give me precise costs but i am testing rigth now so i need to be able to have an easy transition for launch

You should build this around the **Runway API** for video generation, with your app sending a constrained prompt + selected style preset, then polling for completion and returning a 20-second clip to the user. Runway’s current billing page shows video models priced in credits per second, with credits sold at \$0.01 each, and the latest docs list `gen4_turbo` at 5 credits per second, `veo3.1` at 20 credits per second without audio, and `veo3.1_fast` at 10 credits per second without audio.[^1_1][^1_2]

## Best API choice

For your “fast ad builder with limited design choices” use case, Runway is the cleanest fit because it supports text-to-video and image-to-video task flows and has a documented async task pattern. The API docs also show a required version header (`2024-11-06`) and bearer authentication, which makes it straightforward to integrate behind your own backend so users never see your provider key.[^1_3][^1_4][^1_5]

## Cost math for 20 seconds

If you use `gen4_turbo`, a 20-second clip costs 100 credits, which is \$1.00 at \$0.01 per credit. If you use `veo3.1_fast` without audio, 20 seconds costs 200 credits, or \$2.00. If you use `veo3.1` without audio, 20 seconds costs 400 credits, or \$4.00. For a launch-friendly product, `gen4_turbo` is the lowest-cost option in the official pricing table among the commonly used video models shown in the docs.[^1_2][^1_1]

## How to map your attached styles

Use your attached style cards as a **local preset layer** in your app, then translate the user’s selection into prompt modifiers rather than trying to send the image itself as the whole style system. For example: “Cute isometric” becomes prompts like “isometric, cute, playful, pastel, rounded shapes,” while “Cyberpunk” becomes “neon, high contrast, futuristic, urban night, reflections.” That keeps your UI fast and lets you swap providers later without changing the product experience.

A good implementation pattern is:

- User picks `stylePreset`.
- User chooses `productType`, `headline`, `cta`, `logoUrl`, `brandColors`, `aspectRatio`.
- Your backend builds a final prompt from a preset dictionary.
- Your backend calls the video API.
- Your backend tracks retries and state.


## Backend flow

Use your own backend as the orchestration layer so you can enforce the 4-retry rule, billing limits, and provider switching later. The provider returns an async task ID, then your backend polls until completion and stores the resulting video URL. This is the cleanest way to support “quick select, generate, retry up to 4 times” without exposing API credentials or letting the frontend directly control expensive generation calls.[^1_4][^1_3]

### Suggested architecture

1. Frontend: style picker, short form, preview panel, retry button.
2. Backend: prompt builder, job queue, retry counter, provider adapter.
3. Database: `campaigns`, `generations`, `style_presets`, `usage_events`.
4. Storage/CDN: save generated clips and thumbnails.
5. Billing: per-generation usage metering and plan limits.

## Example prompt builder

Here is a practical TypeScript-style structure you can drop into your app:

```ts
type StylePreset = {
  name: string;
  tags: string[];
  negativeTags?: string[];
};

const stylePresets: Record<string, StylePreset> = {
  cute_isometric: {
    name: "Cute isometric",
    tags: ["isometric", "cute", "playful", "pastel colors", "soft lighting", "rounded shapes"],
  },
  cyberpunk: {
    name: "Cyberpunk",
    tags: ["neon", "futuristic", "high contrast", "urban night", "reflective surfaces", "glow"],
  },
  photo_bokeh: {
    name: "Bokeh",
    tags: ["photorealistic", "shallow depth of field", "soft bokeh", "cinematic", "high detail"],
  },
};

function buildPrompt(input: {
  styleKey: string;
  product: string;
  headline: string;
  cta: string;
  brandColors?: string[];
}) {
  const style = stylePresets[input.styleKey];
  const colors = input.brandColors?.length ? `Brand colors: ${input.brandColors.join(", ")}.` : "";
  return [
    `Create a 20-second advertisement video for ${input.product}.`,
    `Headline: ${input.headline}.`,
    `Call to action: ${input.cta}.`,
    `Style: ${style.name}.`,
    `Visual tags: ${style.tags.join(", ")}.`,
    colors,
    "Clean commercial composition, clear product focus, polished motion design, no extra text except the headline and CTA.",
  ].filter(Boolean).join(" ");
}
```


## API call pattern

Runway’s docs show bearer auth and a task-based workflow, so your backend should create the task, then poll for the result until the clip is done. The docs also show the API version header update and the newer direct-resolution behavior for `/v1/image_to_video`, so keep your adapter versioned from day one to make launch transitions easier.[^1_5][^1_3][^1_4]

```ts
async function createVideoTask(payload: {
  prompt: string;
  duration: number;
  ratio: string;
  model: string;
}) {
  const res = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: payload.prompt,
      duration: payload.duration,
      ratio: payload.ratio,
      model: payload.model,
    }),
  });

  if (!res.ok) throw new Error(`Runway create failed: ${res.status}`);
  return res.json();
}
```

Because the public docs emphasize an async task model and task IDs, structure your polling like this:

```ts
async function pollTask(taskId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
        "X-Runway-Version": "2024-11-06",
      },
    });
    const json = await res.json();
    if (json.status === "SUCCEEDED") return json;
    if (json.status === "FAILED") throw new Error("Generation failed");
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error("Timed out");
}
```


## Retry control

Enforce the “4 retries after the initial try” rule in your own database, not in the frontend. That means each campaign gets one initial generation plus up to four re-generations, with every retry reusing the same structured inputs and optionally changing only one variable at a time. A simple rule is to let retries only change the style, product shot angle, or CTA wording, so results stay predictable and cheap.

```ts
async function canGenerate(campaignId: string) {
  const attempts = await db.generation.count({ where: { campaignId } });
  return attempts < 5;
}
```


## Launch-ready transition

To make testing easy now and launch painless later, create a provider abstraction like `VideoProvider.generate()` and keep all Runway-specific code in one module. Then you can switch to a different provider, add a second model, or route high-priority customers to a faster plan without rewriting the frontend. You should also store the original prompt, preset ID, model name, duration, and cost per job so your billing and analytics stay audit-friendly.

If you want, I can turn this into a concrete Next.js + Postgres + queue-worker implementation with endpoint definitions, database schema, and a production-ready prompt template for each of your attached style cards.
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://docs.dev.runwayml.com/guides/pricing/

[^1_2]: https://docs.dev.runwayml.com/usage/billing/

[^1_3]: https://docs.dev.runwayml.com/api/

[^1_4]: https://apis.io/rules/runway/runway-rules/

[^1_5]: https://docs.dev.runwayml.com/api-details/versions/2024-11-06/

[^1_6]: image.jpg

[^1_7]: image-2.jpg

[^1_8]: https://piapi.ai/blogs/luma-dream-machine-api-pricing

[^1_9]: https://www.simalabs.ai/resources/runway-gen-4-api-pricing-2025-sima-labs-cdn-cost-reduction

[^1_10]: https://sider.ai/blog/ai-videos/luma-dream-machine-api

[^1_11]: https://metronome.com/pricing-index/runway-api

[^1_12]: https://piapi.ai/dream-machine-api

[^1_13]: https://tickerr.ai/pricing/luma

[^1_14]: https://rapidapi.com/llbbmm/api/luma-dream-machine/pricing

[^1_15]: https://lumaai-help.freshdesk.com/support/solutions/articles/151000210176-what-are-your-prices-for-api-

[^1_16]: https://medium.com/@husseinfree010/how-i-built-an-ai-video-generator-using-runway-and-javascript-7c5d91f91c97

[^1_17]: https://apidoc.deerapi.com/api/video/runway/compat/image-to-video

[^1_18]: https://docs.kie.ai/runway-api/generate-ai-video

[^1_19]: https://docs.kie.ai/runway-api/quickstart

[^1_20]: https://docs.kie.ai/cn/runway-api/generate-ai-video

[^1_21]: https://www.skill-gallery.jp/en/skills/vm0-ai/runway

[^1_22]: https://github.com/runwayml/chrome-extension-tutorial


---

# okay~ can you please make a table for me showing the costs for Runway, and re-do my code for JSON? Give me details /instrucitons on 'Freemium' then 'Launch' 10k users, 250k users>costs, etc

Here’s the clean cost table and a JSON-ready code shape for your app. For Runway API video pricing, the official docs list credits at \$0.01 each, with `gen4_turbo` at 5 credits/sec and `veo3.1` / `veo3.1_fast` at 20 / 10 credits/sec without audio, respectively.[^2_1][^2_2]

## Runway costs

| Tier | What it means | Cost basis | 20s clip cost | Notes |
| :-- | --: | --: | --: | :-- |
| Freemium | 125 one-time credits in the consumer plan | 100 credits for 20s on `gen4_turbo` | \$1.00 | One full 20s clip uses most of the free allotment; credits do not stretch far beyond that [^2_3][^2_4]. |
| Launch | 10,000 users | Cost depends on actual generation volume | \$1.00 per 20s clip on `gen4_turbo` | User count is not the cost driver; completed generations are [^2_2][^2_4]. |
| Launch | 250,000 users | Cost depends on actual generation volume | \$1.00 per 20s clip on `gen4_turbo` | You should budget by generation rate, retry rate, and average clip length [^2_2][^2_4]. |

A more useful launch view is “cost per generated video,” not “cost per user,” because a user might generate zero clips or five clips. For your app, the math is simple: 20 seconds on `gen4_turbo` is 100 credits, which is \$1.00; 20 seconds on `veo3.1_fast` is 200 credits, which is \$2.00; and 20 seconds on `veo3.1` is 400 credits, which is \$4.00.[^2_4][^2_1]

## JSON-first structure

Use this payload shape from the frontend to your backend. It keeps the UI limited, predictable, and easy to switch from test to launch later.

```json
{
  "campaignId": "cmp_12345",
  "durationSeconds": 20,
  "model": "gen4_turbo",
  "aspectRatio": "16:9",
  "stylePreset": "cute_isometric",
  "brand": {
    "name": "Acme",
    "colors": ["#FFCC66", "#FFFFFF"],
    "logoUrl": "https://cdn.example.com/logo.png"
  },
  "creative": {
    "product": "sports drink",
    "headline": "Power your next move",
    "cta": "Shop now"
  },
  "retryCount": 0
}
```


## Backend JSON builder

This is the core prompt/config builder you want in your server code.

```ts
type StylePreset = {
  name: string;
  tags: string[];
  promptAdditions?: string[];
};

const STYLE_PRESETS: Record<string, StylePreset> = {
  cute_isometric: {
    name: "Cute isometric",
    tags: ["isometric", "cute", "playful", "pastel", "rounded shapes"],
  },
  cyberpunk: {
    name: "Cyberpunk",
    tags: ["neon", "futuristic", "high contrast", "urban night", "glow"],
  },
  photo_bokeh: {
    name: "Bokeh",
    tags: ["photorealistic", "cinematic", "shallow depth of field", "soft lighting"],
  }
};

export function buildRunwayJob(input: {
  campaignId: string;
  durationSeconds: number;
  model: "gen4_turbo" | "veo3.1_fast" | "veo3.1";
  aspectRatio: "16:9" | "9:16" | "1:1";
  stylePreset: string;
  brandName: string;
  brandColors?: string[];
  logoUrl?: string;
  product: string;
  headline: string;
  cta: string;
  retryCount: number;
}) {
  const style = STYLE_PRESETS[input.stylePreset];
  const prompt = [
    `Create a ${input.durationSeconds}-second advertisement video for ${input.product}.`,
    `Brand: ${input.brandName}.`,
    `Headline: ${input.headline}.`,
    `CTA: ${input.cta}.`,
    `Style: ${style.name}.`,
    `Visual cues: ${style.tags.join(", ")}.`,
    input.brandColors?.length ? `Brand colors: ${input.brandColors.join(", ")}.` : "",
    input.logoUrl ? `Include brand logo subtly and cleanly.` : "",
    `Keep the composition commercial, polished, and conversion-focused.`,
    `No extra text beyond headline and CTA.`
  ].filter(Boolean).join(" ");

  return {
    campaignId: input.campaignId,
    provider: "runway",
    model: input.model,
    durationSeconds: input.durationSeconds,
    aspectRatio: input.aspectRatio,
    retryCount: input.retryCount,
    prompt,
    stylePreset: input.stylePreset
  };
}
```


## Freemium setup

For freemium, treat the free credits as a product demo, not a real scale tier. The point is to let a user generate one strong 20-second ad, then force them toward signup, saved projects, or a paid plan. If you stay on `gen4_turbo`, one clip costs \$1.00 in API usage, which is already close to or above many consumer free-plan economics, so you need tight conversion control.[^2_2][^2_4]

Recommended freemium rules:

- Allow 1 initial generation.
- Allow 1–2 preview renders at lower resolution or shorter duration.
- Enforce 4 retries maximum across the campaign.
- Save the prompt and creative config after each try.
- Show a “regenerate with same style” button only after signup.


## Launch 10k users

At 10,000 users, the real question is how many clips each user generates. If only 10% of users generate one 20-second clip, your spend is roughly 1,000 clips × \$1.00 = \$1,000 on `gen4_turbo`. If your retry rate is high, multiply that by roughly 1.2 to 1.5 depending on how often people rerun the ad.[^2_2][^2_4]

A practical launch budget model:

- 10,000 registered users.
- 8–12% generate at least one clip.
- 1.2 average tries per successful clip.
- `gen4_turbo` at \$1.00 per 20 seconds.
- Budget range: about \$960 to \$1,440 for that generation volume.


## Launch 250k users

At 250,000 users, do not budget by user count alone. Budget by active creators, because the API cost is tied to clips generated, not accounts created. If 5% generate one clip, that is 12,500 clips, or about \$12,500 on `gen4_turbo` before retries.[^2_4][^2_2]

A practical enterprise-style model:

- 250,000 registered users.
- 3–7% generate at least one clip.
- 1.1–1.4 average tries per successful clip.
- `gen4_turbo` at \$1.00 per 20 seconds.
- Budget range: roughly \$8,250 to \$19,250 depending on retry and conversion behavior.


## Implementation notes

Use a job table with explicit states so retries are controlled and traceable. Each generation should store `campaignId`, `stylePreset`, `model`, `prompt`, `status`, `costCredits`, `costUSD`, and `retryIndex`. That makes it easy to switch providers later while keeping your frontend unchanged.

```ts
type GenerationRequest = {
  campaignId: string;
  stylePreset: string;
  model: "gen4_turbo" | "veo3.1_fast" | "veo3.1";
  durationSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  headline: string;
  cta: string;
  retryIndex: number;
};

type GenerationRecord = GenerationRequest & {
  provider: "runway";
  status: "queued" | "running" | "succeeded" | "failed";
  taskId?: string;
  outputUrl?: string;
  costCredits?: number;
  costUSD?: number;
};
```


## Cost control

For launch, default to `gen4_turbo` unless a customer explicitly pays for a higher-quality tier. That keeps your 20-second unit cost at \$1.00 and simplifies pricing. Your 4-retry cap should be enforced on the backend, and failed jobs should still count against the retry limit if the provider accepted the task.[^2_2][^2_4]

A good pricing ladder for your app is:

- Freemium: 1 clip included.
- Starter: 5–10 clips/month.
- Pro: 25–50 clips/month.
- Enterprise: custom volume with queue priority.

Would you like me to turn this into a Next.js API route set plus a Postgres schema in JSON/SQL format?
<span style="display:none">[^2_10][^2_5][^2_6][^2_7][^2_8][^2_9]</span>

<div align="center">⁂</div>

[^2_1]: https://docs.dev.runwayml.com/guides/pricing/

[^2_2]: https://fairstack.ai/blog/runway-pricing

[^2_3]: https://www.eesel.ai/blog/runway-ai-pricing

[^2_4]: https://docs.dev.runwayml.com/usage/billing/

[^2_5]: https://aicostplanner.com/runway-api-pricing/

[^2_6]: https://unifuncs.com/s/TjbeDeE8

[^2_7]: https://www.simalabs.ai/resources/runway-gen-4-api-pricing-2025-sima-labs-cdn-cost-reduction

[^2_8]: https://metronome.com/pricing-index/runway-api

[^2_9]: https://checkthat.ai/brands/runway/pricing

[^2_10]: https://apostle.io/pricing/runway-gen-4/


---

# ok, please re-do the breakdown for 'Cost for generrated video' as each user will get a total of (5) tries once they select a campaign. The API should allow the user to be able to see all 5 generated items or they will need to buy in to an addtional app campaign to get new generations. Also i would appreciate it if you gave me a column showing total video clips allotted in addtioan to all of the other columns.  'Cost Basis'= 100 for 20s on gen4_turbo / AND ~of videos per run= 2 videos,  (all videos need the option to include audio)/ and if i understand this correctly, for my ENITIRE test phase of my project, i will only be able to generate ONE video with audio for free, correct? I know this is my last perplexity question, so i am loading this in hopes of a  detailed answer. I guess there is no other product i can imlpement into my project like Runway huh? PLease provide detailed table!

Yes — and one important correction first: **your test phase is not “one free video with audio” in a universal sense**. Runway’s free plan includes 125 one-time credits, but the free plan listing shows access to `Gen-4 Turbo (Image to Video)` and generative audio features on the consumer side, while the API pricing page shows video generation is billed per credit, and `veo3.1` / `veo3.1_fast` audio variants cost more than their no-audio versions. So whether you can generate a free audio video depends on which exact product surface you’re using: consumer plan vs API, and which model you choose.[^3_1][^3_2]

## Cost table

Below is the breakdown using your stated assumption that **100 credits = 20s on `gen4_turbo`**, and that each campaign gives the user **5 total tries**, with **2 videos per run** if your app returns 2 generated items each attempt.[^3_1]


| Tier | Total video clips allotted | Tries per campaign | Videos per run | Model / cost basis | Cost per 20s video | Cost per run | Cost per full 5-try campaign | Notes |
| :-- | --: | --: | --: | :-- | --: | --: | --: | :-- |
| Freemium | 1 clip | 1 | 1 | `gen4_turbo` at 5 credits/sec, 100 credits for 20s | \$1.00 | \$1.00 | \$1.00 | This is the cleanest interpretation of the 125-credit free tier; 1 full 20s clip fits, with credits left over [^3_2][^3_1]. |
| Freemium if audio is required | 1 clip | 1 | 1 | Audio model costs more than no-audio model | \$2.00 to \$4.00 | \$2.00 to \$4.00 | \$2.00 to \$4.00 | If you insist on audio, the no-audio free assumption no longer holds cleanly; API audio models are priced higher [^3_1]. |
| Launch test | 5 clips | 5 | 1 | `gen4_turbo` | \$1.00 | \$1.00 | \$5.00 | This is the most straightforward backend rule if each try equals one 20-second output [^3_1]. |
| Launch standard | 10 clips | 5 | 2 | `gen4_turbo` | \$1.00 | \$2.00 | \$10.00 | If each run returns 2 generated items, each try costs 2× the single-clip price [^3_1]. |
| Launch scaled | 25 clips | 5 | 5 | `gen4_turbo` | \$1.00 | \$5.00 | \$25.00 | This is the upper bound if the campaign can expose all 5 tries and each try returns one clip [^3_1]. |

## How to read the table

Your key cost unit is **per generated clip**, not per user. If your system gives 5 tries and each try produces 2 videos, then the total allotted clips per campaign is 10, and at `gen4_turbo` that is about \$10.00 in API spend for a fully used campaign. If instead you mean 5 tries total and each try yields 1 video, then the campaign max is 5 clips, or about \$5.00.[^3_1]

The phrase “all videos need the option to include audio” does **not** mean every clip must be audio-enabled by default. It means your UI should expose audio as an option and route those jobs to a more expensive model or recipe when selected. That is the correct product design if you want clean launch economics.[^3_1]

## Freemium logic

For freemium, I would make the user get **1 free campaign** with either:

- 1 clip total, or
- 1 try with 2 preview outputs, one of which they can keep.

If your freemium user gets 125 credits, a 20-second `gen4_turbo` clip at 100 credits is feasible, but you should not promise unlimited retries because the free plan is only 125 one-time credits. If you add audio to that free test, you may exceed the free allowance depending on the exact model path used, so the safest product rule is “free preview = no-audio, paid upgrade = audio-enabled”.[^3_2][^3_1]

## Launch logic

For launch, set your campaign rule like this:

- User selects a campaign.
- They get 5 total generation attempts.
- Each attempt can return 1 or 2 candidate clips.
- They can view all generated outputs in the campaign history.
- After 5 attempts, they must buy a new campaign to generate more.

That structure is easy to implement and it lets you cap spend precisely. If you want 2 outputs per run, your worst-case exposure is 10 clips per campaign, so you should price the campaign accordingly and include retries in your margin.[^3_1]

## JSON shape

Here is a cleaner JSON contract for your backend.

```json
{
  "campaignId": "cmp_12345",
  "plan": "freemium",
  "model": "gen4_turbo",
  "durationSeconds": 20,
  "audioEnabled": false,
  "triesAllowed": 5,
  "videosPerTry": 2,
  "totalClipsAllotted": 10,
  "retryCount": 0,
  "stylePreset": "cute_isometric",
  "creative": {
    "product": "sports drink",
    "headline": "Power your next move",
    "cta": "Shop now"
  },
  "brand": {
    "name": "Acme",
    "colors": ["#FFCC66", "#FFFFFF"],
    "logoUrl": "https://cdn.example.com/logo.png"
  }
}
```


## Backend rules

Use these rules in your app:

- `totalClipsAllotted = triesAllowed * videosPerTry`.
- If `audioEnabled = true`, route to the audio-capable model and recalc cost.
- If `retryCount >= triesAllowed`, block generation and show the “buy new campaign” flow.
- Keep every generated result attached to the same campaign so the user can see all 5 tries in one place.

```ts
type Campaign = {
  campaignId: string;
  plan: "freemium" | "paid";
  triesAllowed: number;
  videosPerTry: number;
  totalClipsAllotted: number;
  audioEnabled: boolean;
  retryCount: number;
};

function canGenerate(c: Campaign) {
  return c.retryCount < c.triesAllowed;
}

function totalClipsAllotted(triesAllowed: number, videosPerTry: number) {
  return triesAllowed * videosPerTry;
}
```


## About other products

No, Runway is **not** the only product you can use. The Runway docs list multiple video-capable models and workflows, and the broader market includes other providers like Veo-based routes and other third-party wrappers, but if your priority is a controlled ad-builder with structured presets, Runway is a strong choice because the pricing and model usage are easy to reason about. The tradeoff is that different providers will have different audio support, pricing, and latency, so if your goal is an easy launch transition, you should abstract the provider behind a single internal interface now.[^3_3][^3_1]

If you want the next step, I can turn this into a **single launch-ready pricing matrix** with columns for `freemium`, `5-try campaign`, `10k users`, and `250k users`, including formulas for audio-on vs audio-off.
<span style="display:none">[^3_10][^3_4][^3_5][^3_6][^3_7][^3_8][^3_9]</span>

<div align="center">⁂</div>

[^3_1]: https://docs.dev.runwayml.com/guides/pricing/

[^3_2]: https://runwayml.com/pricing

[^3_3]: https://apis.io/providers/runway/

[^3_4]: https://docs.dev.runwayml.com/api-details/api_changelog/

[^3_5]: https://apis.io/plans/runway/runway-plans-pricing/

[^3_6]: https://aicostplanner.com/runway-api-pricing/

[^3_7]: https://aiunpacking.com/review/runway/

[^3_8]: https://fairstack.ai/blog/runway-pricing

[^3_9]: https://aiagentsquare.com/agents/runway-ml

[^3_10]: https://unifuncs.com/s/TjbeDeE8


---

# awesome. To clarify, the freemium is for (me) to test, not offer. I expect to pay for Runways service once i go into launch. \#2) All users for my APP will only get 5 total tries to generate their advertisment campaign using AI. This is designed for non-business people that are small business or professional business owners- a way to allow them to advertise someting without hiring a marketing team or having to hire influencers, etc. for \$100k The business world is very pro-business and 50% of the entire business market is being ignored because they are smaller operations generating total sales of \$200k a year or somehting. SO fremium is for me to test. then i need a table to show launch: 100 videos + Video/audio options> 1000, 2000, 5000, 10,000 etc, per month what will be the cost (for me to pay @ launching of product. then provide me detail instrucitons and backend/front end json for Cursor please

Absolutely. Since **freemium is only for your own testing**, the launch math should be built around your real production usage, and the cleanest rule is: **each campaign gets 5 total generation tries**, with the user seeing every generated item in that campaign history. Runway’s API pricing is credit-based at \$0.01 per credit, with `gen4_turbo` at 5 credits/sec, and audio-capable `veo3.1` / `veo3.1_fast` priced higher than no-audio versions.[^4_1][^4_2]

## Launch cost table

Below I’m using your working assumptions:

- `gen4_turbo` = 100 credits for 20 seconds = **\$1.00 per 20s video**.[^4_2]
- Each campaign = **5 tries total**.
- You want columns for **total video clips allotted** and **video/audio option cost**.
- I’m showing one version for **1 video per try** and a second note for **2 videos per try** because that changes the budget a lot.[^4_1][^4_2]

| Monthly generated videos | Tries per campaign | Videos per try | Total clips allotted per campaign | No-audio model cost per clip (`gen4_turbo`) | Cost per campaign | Monthly cost at this volume | Audio option note |
| --: | --: | --: | --: | --: | --: | --: | :-- |
| 100 | 5 | 1 | 5 | \$1.00 | \$5.00 | \$100.00 | Audio adds cost because `veo3.1` is \$4.00/clip and `veo3.1_fast` is \$2.00/clip for 20s [^4_1]. |
| 1,000 | 5 | 1 | 5 | \$1.00 | \$5.00 | \$1,000.00 | Same math; volume only changes total spend, not unit cost [^4_1][^4_2]. |
| 2,000 | 5 | 1 | 5 | \$1.00 | \$5.00 | \$2,000.00 | If you allow audio on every clip, expect materially higher spend [^4_1]. |
| 5,000 | 5 | 1 | 5 | \$1.00 | \$5.00 | \$5,000.00 | Use this only if your conversion funnel is already strong [^4_1]. |
| 10,000 | 5 | 1 | 5 | \$1.00 | \$5.00 | \$10,000.00 | At this scale, retries and failed generations matter a lot [^4_1][^4_2]. |

## Audio and 2-video runs

If you actually mean **2 videos per try**, then the math doubles. At `gen4_turbo`, each run becomes **2 × \$1.00 = \$2.00 per try**, and a 5-try campaign becomes **\$10.00 per campaign**.[^4_2]


| Monthly generated videos | Tries per campaign | Videos per try | Total clips allotted per campaign | No-audio cost per try | Cost per campaign | Monthly cost at this volume |
| --: | --: | --: | --: | --: | --: | --: |
| 100 | 5 | 2 | 10 | \$2.00 | \$10.00 | \$200.00 |
| 1,000 | 5 | 2 | 10 | \$2.00 | \$10.00 | \$2,000.00 |
| 2,000 | 5 | 2 | 10 | \$2.00 | \$10.00 | \$4,000.00 |
| 5,000 | 5 | 2 | 10 | \$2.00 | \$10.00 | \$10,000.00 |
| 10,000 | 5 | 2 | 10 | \$2.00 | \$10.00 | \$20,000.00 |

For audio, the official pricing table shows `veo3.1` at 40 credits/sec with audio and 20 credits/sec without audio, and `veo3.1_fast` at 15 credits/sec with audio and 10 credits/sec without audio. For a 20-second clip that means:[^4_1]

- `veo3.1_fast` audio = 300 credits = **\$3.00**.
- `veo3.1` audio = 800 credits = **\$8.00**.
- `veo3.1_fast` no-audio = **\$2.00**.
- `veo3.1` no-audio = **\$4.00**.[^4_1]


## Freemium clarification

Your freemium is **for you only**, so the real question is whether your test budget can cover one clip with audio. Based on the current public docs, the free consumer tier is 125 credits, but the API itself is billed per generation and per model, and audio-capable generation costs more than `gen4_turbo`. So the safest answer is: **no, you should not assume you get one free audio video in the API test phase**; you should assume you’ll pay for API generation once you start testing audio routes.[^4_3][^4_1]

## Recommended product rules

For your app, I would set these rules:

- One campaign = 5 tries total.
- Each try returns 1 or 2 clips, depending on plan.
- After 5 tries, the campaign is locked.
- To generate more, the user buys a new campaign.
- Store every generated clip in the campaign history so users can see all outputs.

That design is clean, easy to explain, and easy to meter. It also keeps you safe from runaway cost because your spend is tied to the number of accepted generation attempts, not the number of registered accounts.[^4_2][^4_1]

## Cursor JSON

Here is a practical backend/frontend JSON contract you can paste into Cursor.

```json
{
  "campaignId": "cmp_2026_0001",
  "mode": "launch",
  "plan": "paid",
  "triesAllowed": 5,
  "retryCount": 0,
  "videosPerTry": 1,
  "totalClipsAllotted": 5,
  "durationSeconds": 20,
  "aspectRatio": "16:9",
  "audioEnabled": false,
  "provider": "runway",
  "model": "gen4_turbo",
  "creative": {
    "businessType": "small business",
    "product": "local fitness coaching",
    "headline": "Train smarter, not harder",
    "cta": "Book now"
  },
  "style": {
    "preset": "cute_isometric",
    "tone": "clean, friendly, premium"
  },
  "brand": {
    "name": "MyBrand",
    "logoUrl": "https://cdn.example.com/logo.png",
    "colors": ["#111111", "#FFFFFF"]
  }
}
```


## Backend schema

```ts
type CampaignJob = {
  campaignId: string;
  userId: string;
  plan: "test" | "launch";
  triesAllowed: number;      // always 5
  retryCount: number;        // increments on every accepted generation
  videosPerTry: number;      // 1 or 2
  totalClipsAllotted: number; // triesAllowed * videosPerTry
  durationSeconds: 20;
  audioEnabled: boolean;
  provider: "runway";
  model: "gen4_turbo" | "veo3.1_fast" | "veo3.1";
  status: "draft" | "queued" | "running" | "succeeded" | "failed" | "locked";
};
```

```ts
function calculateTotalClipsAllotted(triesAllowed: number, videosPerTry: number) {
  return triesAllowed * videosPerTry;
}

function calculateClipCostUSD(model: string, durationSeconds: number, audioEnabled: boolean) {
  if (model === "gen4_turbo") return 1.00; // 100 credits for 20s
  if (model === "veo3.1_fast" && audioEnabled) return 3.00;
  if (model === "veo3.1" && audioEnabled) return 8.00;
  if (model === "veo3.1_fast" && !audioEnabled) return 2.00;
  if (model === "veo3.1" && !audioEnabled) return 4.00;
  return 1.00;
}
```


## Frontend JSON

```json
{
  "selectedCampaignId": "cmp_2026_0001",
  "selectedStylePreset": "cyberpunk",
  "selectedModel": "gen4_turbo",
  "selectedDurationSeconds": 20,
  "selectedAudioEnabled": false,
  "selectedVideosPerTry": 1,
  "remainingTries": 3,
  "availableOutputs": [
    {
      "generationId": "gen_1",
      "status": "succeeded",
      "videoUrl": "https://cdn.example.com/video1.mp4"
    }
  ]
}
```


## Cursor build steps

1. Build a campaign creation endpoint that initializes `triesAllowed = 5`.
2. Build a generation endpoint that checks `retryCount < triesAllowed`.
3. Build a prompt builder that maps style presets to tags.
4. Build a provider adapter for Runway only, but isolate it behind `VideoProvider`.
5. Store every output in a `campaign_generations` table.
6. Show all outputs in a campaign gallery.
7. Lock the campaign after 5 tries and show a “buy another campaign” CTA.
8. Add audio as a boolean option, but route it to the audio-priced model and recalc cost before generating.

## What to use in launch

If your goal is low cost and simple pricing, `gen4_turbo` is the most practical default. If your goal is higher-fidelity ad output with audio, you should price that as a premium tier because the audio-supported models are much more expensive per 20 seconds.[^4_2][^4_1]

Would you like me to turn this into a single **Cursor prompt** that generates the full Next.js API, DB schema, and React UI in one pass?
<span style="display:none">[^4_10][^4_11][^4_4][^4_5][^4_6][^4_7][^4_8][^4_9]</span>

<div align="center">⁂</div>

[^4_1]: https://docs.dev.runwayml.com/guides/pricing/

[^4_2]: https://docs.dev.runwayml.com/usage/billing/

[^4_3]: https://runwayml.com/pricing

[^4_4]: https://fairstack.ai/blog/runway-pricing

[^4_5]: https://aiagentsquare.com/agents/runway-ml

[^4_6]: https://www.eesel.ai/blog/runway-ai-pricing

[^4_7]: https://apostle.io/pricing/runway-gen-4/

[^4_8]: https://blocksentient.com/review/runway/

[^4_9]: https://metronome.com/pricing-index/runway-api

[^4_10]: https://checkthat.ai/brands/runway/pricing

[^4_11]: https://fluxnote.io/guides/runway-pricing-breakdown-2026


---

# Yes, please generate the Cursor prompt for the full Next.js stack

Below is a single Cursor prompt you can paste to generate the full Next.js stack, with your 5-try campaign rule, JSON-first backend, style presets from the images, and Runway integration abstraction.

```text
You are building a production-ready Next.js 14+ app (App Router) for an AI advertisement video generator.

Goal:
Build a web app where a user creates a campaign, selects from a limited set of visual style presets, enters minimal ad inputs, and generates AI video ads using Runway. Each campaign allows exactly 5 total generation tries. The user must be able to view all generated outputs in the campaign history/gallery. After 5 tries, the campaign is locked and the user must buy a new campaign to generate more videos.

Technical stack:
- Next.js 14+ App Router
- TypeScript
- TailwindCSS
- Prisma ORM
- PostgreSQL
- Zod for validation
- Server Actions or Route Handlers
- Optional Redis/BullMQ for queued generation jobs
- Store generated videos in S3-compatible storage or keep provider URLs initially
- Use a clean provider abstraction so Runway can be swapped later

Primary requirements:
1. Campaigns
- A campaign represents one ad project.
- Each campaign has:
  - id
  - userId
  - name
  - status: draft | active | locked | completed
  - triesAllowed = 5
  - retryCount
  - videosPerTry
  - totalClipsAllotted = triesAllowed * videosPerTry
  - durationSeconds = 20
  - aspectRatio
  - audioEnabled boolean
  - selectedStylePreset
  - productName
  - headline
  - cta
  - brandName
  - brandColors
  - logoUrl
  - createdAt / updatedAt

2. Generation rules
- Every campaign allows 5 total tries.
- After the 5th try, lock the campaign.
- Every try can generate 1 or 2 videos depending on plan/config.
- Save every generated item in the campaign history.
- If the provider fails, still record the attempt.
- The user should see all outputs, even failed ones.
- If locked, show CTA to buy another campaign.

3. Pricing logic
- Support two pricing modes:
  - no-audio generation
  - audio-enabled generation
- Build the code so pricing is computed server-side before generation.
- Use a provider adapter so Runway is the default provider.
- Treat `gen4_turbo` as the low-cost default.
- Store cost in credits and USD.
- Make cost calculations configurable from env so launch transition is easy.

4. UI
- Build a clean dashboard with:
  - campaign list
  - create campaign form
  - style preset selection cards
  - generation preview page
  - campaign gallery page with all generated outputs
  - remaining tries indicator
  - locked state and upgrade CTA
- Use responsive design.
- Make the style picker feel like a limited, guided selection flow.
- Users should only select from approved presets.

5. Style presets
Create a preset system based on these categories from the provided reference images:

Video/illustration styles:
- cute_isometric
- neon
- low_poly
- metallic
- cute_character
- cute_avatar
- origami
- mecha
- animated_character
- clay_model
- wood_carving
- minimal_balloon
- stone_carving
- plastic_bricks
- fluffy
- multicolor_mecha
- mythical

Photo styles:
- indoor
- outdoor
- bokeh
- black_and_white
- close_up
- advertising_testimonial
- cyberpunk
- fish_eye
- studio_shot
- wet_plate
- motion_blur
- instant_photo
- moody_portrait
- bold_portrait
- water_action
- sunset
- brutalist_product
- summer_product
- advertising_product
- nautical_product
- advertising_podium
- framed
- hieroglyph
- people_street_photography

For each preset, define:
- label
- category
- description
- promptTags array
- recommendedUseCases array
- whether it is photo or illustration/video oriented

6. Prompt builder
Implement a server-side function that builds a Runway prompt from:
- style preset
- productName
- brandName
- headline
- cta
- brandColors
- logoUrl
- aspectRatio
- durationSeconds
- audioEnabled

The builder should:
- output JSON
- include structured prompt fields
- include negative prompt fields
- include style tags
- include ad constraints:
  - commercial
  - clear product focus
  - polished
  - conversion-oriented
  - no extra text except headline and CTA
- be easy to swap to another provider later

7. Runway integration
Implement a provider adapter interface like:

type VideoProvider = {
  createVideoJob(input): Promise<{ taskId: string }>
  getVideoJob(taskId: string): Promise<status>
}

Build a Runway adapter using:
- bearer auth
- version header
- async task creation
- polling endpoint
- error handling
- retry-safe status updates

Do NOT hardcode secrets on the client.
Use environment variables for API keys.

8. Backend routes / server actions
Create:
- POST /api/campaigns
- GET /api/campaigns
- GET /api/campaigns/[id]
- POST /api/campaigns/[id]/generate
- GET /api/campaigns/[id]/generations
- POST /api/campaigns/[id]/lock or automatic lock logic

Validation:
- Use Zod schemas for all request payloads.
- Reject generation if retryCount >= triesAllowed.
- Enforce a maximum of 5 tries per campaign.
- Validate style preset exists.
- Validate audioEnabled boolean.

9. Database schema
Create Prisma models for:
- User
- Campaign
- Generation
- StylePreset

Campaign should relate to Generation records.
Generation should store:
- provider
- model
- taskId
- prompt JSON
- input JSON
- outputUrl
- thumbnailUrl
- status
- errorMessage
- costCredits
- costUSD
- createdAt

10. UI behavior
- On campaign detail page, show:
  - campaign metadata
  - selected style
  - remaining tries
  - cost summary
  - generation history
  - clickable generated clips
  - “Generate again” button until 5 tries reached
- If campaign is locked:
  - disable generation button
  - show “Buy a new campaign” button
- If audio is enabled:
  - show cost increase clearly
  - explain that audio uses a more expensive generation path

11. JSON contracts
Use JSON for both frontend and backend state where practical.

Campaign creation JSON:
{
  "name": "",
  "productName": "",
  "headline": "",
  "cta": "",
  "brandName": "",
  "brandColors": [],
  "logoUrl": "",
  "stylePreset": "",
  "durationSeconds": 20,
  "aspectRatio": "16:9",
  "audioEnabled": false,
  "videosPerTry": 1
}

Generation response JSON:
{
  "campaignId": "",
  "retryCount": 0,
  "triesAllowed": 5,
  "remainingTries": 5,
  "status": "queued",
  "provider": "runway",
  "model": "gen4_turbo",
  "costCredits": 0,
  "costUSD": 0,
  "taskId": "",
  "outputUrl": "",
  "errorMessage": null
}

12. Cost logic
Implement a configurable cost calculator:
- Define creditsPerSecond in config
- Define creditToUSD in config
- Define model multipliers for audio/no-audio
- Default low-cost mode should use gen4_turbo
- Make it easy to switch pricing tiers at launch

13. Deliverables
Generate:
- full file structure
- Prisma schema
- route handlers
- server utilities
- provider adapter
- prompt builder
- React pages/components
- TypeScript types
- example env file
- seed file for style presets
- sample JSON payloads
- README with setup instructions

14. Code quality
- Write clean, modular, production-ready code.
- Use reusable components.
- Use strict TypeScript.
- Avoid unnecessary abstraction.
- Make the MVP easy to launch and easy to swap providers later.

15. Important implementation rules
- The app must never allow more than 5 tries per campaign.
- Users must be able to view all generations for the campaign.
- Campaign history must persist.
- The backend must own pricing logic.
- The frontend must never calculate final cost alone.
- Keep provider-specific logic isolated in /lib/providers/runway.ts.
- Keep preset definitions in /lib/stylePresets.ts.
- Keep cost logic in /lib/pricing.ts.
- Keep prompt construction in /lib/promptBuilder.ts.

Now generate the full Next.js project code with all necessary files and explain where each file goes.
```

If you want, I can also turn this into a second Cursor prompt focused only on the **Prisma schema + API routes** so you can build the backend first.
<span style="display:none">[^5_1][^5_2]</span>

<div align="center">⁂</div>

[^5_1]: image.jpg

[^5_2]: image-2.jpg


---

# ok

Here’s the tighter backend-first Cursor prompt you can use next.

```text
You are building the backend foundation for a Next.js 14+ AI ad generation app.

Stack:
- Next.js 14 App Router
- TypeScript
- Prisma
- PostgreSQL
- Zod
- Server Actions or Route Handlers

Core business rule:
Each campaign allows exactly 5 total generation tries. After the 5th try, the campaign is locked and must require purchase of a new campaign for additional generations.

Requirements:
1. Create Prisma models for:
- User
- Campaign
- Generation
- StylePreset

Campaign fields:
- id
- userId
- name
- status: draft | active | locked | completed
- triesAllowed = 5
- retryCount
- videosPerTry
- totalClipsAllotted = triesAllowed * videosPerTry
- durationSeconds = 20
- aspectRatio
- audioEnabled
- selectedStylePreset
- productName
- headline
- cta
- brandName
- brandColors
- logoUrl
- createdAt
- updatedAt

Generation fields:
- id
- campaignId
- provider
- model
- taskId
- promptJson
- inputJson
- outputUrl
- thumbnailUrl
- status
- errorMessage
- costCredits
- costUSD
- createdAt

2. Add Zod schemas for:
- create campaign
- update campaign
- generate video
- lock campaign
- list generations

3. Implement these API routes:
- POST /api/campaigns
- GET /api/campaigns
- GET /api/campaigns/[id]
- POST /api/campaigns/[id]/generate
- GET /api/campaigns/[id]/generations
- POST /api/campaigns/[id]/lock

4. Enforce generation rules:
- Reject generation if retryCount >= triesAllowed
- Increment retryCount on every accepted generation request
- Lock the campaign automatically when retryCount reaches 5
- Return a clear error if locked
- Store all generation attempts, including failures

5. Implement these library files:
- /lib/stylePresets.ts
- /lib/promptBuilder.ts
- /lib/pricing.ts
- /lib/providers/videoProvider.ts
- /lib/providers/runway.ts
- /lib/campaigns.ts
- /lib/generations.ts

6. Style presets:
Include these presets:
- cute_isometric
- neon
- low_poly
- metallic
- cute_character
- cute_avatar
- origami
- mecha
- animated_character
- clay_model
- wood_carving
- minimal_balloon
- stone_carving
- plastic_bricks
- fluffy
- multicolor_mecha
- mythical
- indoor
- outdoor
- bokeh
- black_and_white
- close_up
- advertising_testimonial
- cyberpunk
- fish_eye
- studio_shot
- wet_plate
- motion_blur
- instant_photo
- moody_portrait
- bold_portrait
- water_action
- sunset
- brutalist_product
- summer_product
- advertising_product
- nautical_product
- advertising_podium
- framed
- hieroglyph
- people_street_photography

Each preset should have:
- label
- category
- description
- promptTags
- useCases
- kind: photo | illustration | video

7. Prompt builder:
Create a server-side function that outputs a JSON prompt object using:
- stylePreset
- productName
- brandName
- headline
- cta
- brandColors
- logoUrl
- aspectRatio
- durationSeconds
- audioEnabled

The prompt object should include:
- prompt
- negativePrompt
- styleTags
- adConstraints
- metadata

8. Pricing:
Implement backend cost logic with configurable env-based values:
- creditToUSD
- creditsPerSecond
- audio multiplier
- no-audio multiplier
- model name

Default model should be gen4_turbo.

9. Runway adapter:
Implement a provider adapter interface:
- createVideoJob()
- getVideoJob()
- pollUntilComplete()

Use:
- bearer auth
- API version header
- async task flow
- error handling
- retry-safe status updates

10. Return JSON responses for all routes.
Make the API response structure consistent and easy for the frontend to consume.

11. Add a seed file that inserts all style presets.

12. Add a README with:
- env vars
- database setup
- migration commands
- seed commands
- how the generation workflow works
- how the 5-try campaign rule is enforced

13. Output the complete code with file paths and contents.
Prefer simplicity, clarity, and production readiness.
Do not include frontend UI yet.
```

If you want, I can now make the matching **frontend Cursor prompt** for the campaign builder, style cards, and generation gallery.

---

# yes; should i sign on to runway freemium (i wont include audio for now so i can test flow first)!

Yes — for your stated goal, I’d sign up for Runway Free **only if you want to test the product flow before paying**. The free plan includes 125 one-time credits and access to Gen-4 Turbo image-to-video, plus generative audio tools on the consumer plan, while the API itself is billed separately and has no confirmed free API credits in the official pricing docs.[^7_1][^7_2][^7_3]

## What that means for you

If you are testing **without audio**, the free plan is enough to validate your UX flow, campaign logic, style selection, and retry counters. A 20-second `gen4_turbo` clip costs 100 credits at the API pricing table, so the free 125 credits are enough to cover roughly one full 20-second generation plus a small remainder on the consumer side. However, that does **not** mean the API is free; the official API pricing page says you must create an account and purchase credits for API usage.[^7_4][^7_1]

## My recommendation

- **If you only need to test UI flow and campaign logic:** sign up for Free.
- **If you need to test the actual API generation pipeline end-to-end:** expect to pay once you hit the API, even if you have a free consumer account.[^7_3][^7_4]
- **If you want audio later:** keep it off for now, because audio models are priced higher and will complicate testing costs.[^7_4]


## Best launch path

Use Free now to validate:

- campaign creation,
- 5-try lockout,
- style preset mapping,
- generation gallery,
- frontend state transitions.

Then switch to paid API credits before launch so you can test the real production path without surprises. That gives you the cleanest transition from prototype to launch.[^7_1][^7_4]

## Practical answer

So, yes: **sign on to Runway Free for testing the flow first**, but do not assume that the API generation itself is free just because the consumer plan includes 125 credits.[^7_2][^7_3][^7_1]
<span style="display:none">[^7_10][^7_5][^7_6][^7_7][^7_8][^7_9]</span>

<div align="center">⁂</div>

[^7_1]: https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work

[^7_2]: https://runwayml.com/pricing

[^7_3]: https://yangmao.ai/en/providers/runway/api-pricing/

[^7_4]: https://docs.dev.runwayml.com/guides/pricing/

[^7_5]: https://help.runwayml.com/hc/en-us/articles/50404627334547-Free-plan-details

[^7_6]: https://costbench.com/software/ai-video-generators/runway/free-plan/

[^7_7]: https://blocksentient.com/review/runway/

[^7_8]: https://www.cracked.ai/guide/keyword-driven/runway-free-guide

[^7_9]: https://www.eesel.ai/blog/runway-ai-pricing

[^7_10]: https://www.imagine.art/blogs/runway-ai-pricing


---

# ok. and now: make the matching frontend Cursor prompt for the campaign builder, style cards, and generation gallery.

Here’s a Cursor prompt for the **frontend** only: campaign builder, style cards, generation gallery, and the 5-try locked state. It assumes the backend API already exists and returns JSON consistently. The app should use Next.js App Router, TypeScript, Tailwind, and client components only where interactivity is needed, which matches the recommended App Router pattern for forms and dynamic UI.[^8_1][^8_2]

```text
You are building the frontend for a Next.js 14+ AI advertisement generator.

Stack:
- Next.js 14+ App Router
- TypeScript
- TailwindCSS
- React Hook Form
- Zod
- Fetch API or React Query/SWR for server calls
- Use server components for data display when possible
- Use client components only for interactive forms, selectors, modals, tabs, and upload controls

Goal:
Build a polished frontend where a user can:
- create a campaign
- select one style preset from a limited set of visual cards
- enter minimal ad details
- see the remaining tries count
- generate videos
- view all generated clips in a gallery
- understand when the campaign is locked after 5 tries
- buy a new campaign when locked

Key product rules:
- Each campaign has exactly 5 total tries.
- The user can see all generated outputs for the campaign.
- After 5 tries, the UI must lock generation and show a “Buy new campaign” CTA.
- Audio is optional but should default to off for now.
- Keep the flow very fast and simple for non-technical business users.

Pages to build:
1. /app/dashboard/page.tsx
- Campaign list
- “Create new campaign” button
- Remaining tries summary for each campaign
- Locked state badge
- Last generation thumbnail preview

2. /app/campaigns/new/page.tsx
- Campaign creation form
- Minimal inputs only
- Style card grid
- Save and create campaign
- Show default 20-second duration
- Show default audio off
- Show videosPerTry selector if needed

3. /app/campaigns/[id]/page.tsx
- Main campaign builder
- Selected style preset details
- Input form for:
  - productName
  - headline
  - cta
  - brandName
  - brandColors
  - logoUrl
  - audioEnabled toggle
- Generate button
- Remaining tries indicator
- Cost summary
- Generation history gallery
- Locked state and upgrade CTA

4. /app/campaigns/[id]/gallery/page.tsx
- Full gallery view of all generated outputs
- Grid layout
- Status badges
- Clickable video cards
- Failed items should show the error message
- Show timestamps and retry order

Shared UI components to create:
- /components/campaign/CampaignForm.tsx
- /components/campaign/StylePresetGrid.tsx
- /components/campaign/StylePresetCard.tsx
- /components/campaign/GenerationGallery.tsx
- /components/campaign/GenerationCard.tsx
- /components/campaign/RemainingTriesBadge.tsx
- /components/campaign/LockedCampaignBanner.tsx
- /components/campaign/CostSummary.tsx
- /components/ui/Button.tsx
- /components/ui/Card.tsx
- /components/ui/Input.tsx
- /components/ui/Textarea.tsx
- /components/ui/Badge.tsx
- /components/ui/Switch.tsx
- /components/ui/Select.tsx
- /components/ui/Dialog.tsx

Style preset UI requirements:
- Render presets as cards with:
  - preview image
  - label
  - short description
  - category badge
  - selected state highlight
- Only allow one style preset to be selected.
- Include the style groups from the provided reference:
  - cute_isometric
  - neon
  - low_poly
  - metallic
  - cute_character
  - cute_avatar
  - origami
  - mecha
  - animated_character
  - clay_model
  - wood_carving
  - minimal_balloon
  - stone_carving
  - plastic_bricks
  - fluffy
  - multicolor_mecha
  - mythical
  - indoor
  - outdoor
  - bokeh
  - black_and_white
  - close_up
  - advertising_testimonial
  - cyberpunk
  - fish_eye
  - studio_shot
  - wet_plate
  - motion_blur
  - instant_photo
  - moody_portrait
  - bold_portrait
  - water_action
  - sunset
  - brutalist_product
  - summer_product
  - advertising_product
  - nautical_product
  - advertising_podium
  - framed
  - hieroglyph
  - people_street_photography

Campaign builder behavior:
- Keep the number of fields small.
- Use a guided flow with section headers:
  1. Product
  2. Style
  3. Brand
  4. Output options
- Validate on the client with Zod.
- Disable submit until required fields are filled.
- Show inline validation errors.
- Audio toggle must default to off.
- Add helper text explaining that audio is more expensive and can be enabled later.

Generation workflow:
- When user clicks Generate:
  - submit JSON to POST /api/campaigns/[id]/generate
  - show loading state
  - optimistically add a pending card to the history
  - poll or refresh the generation list after request completes
- Keep the UI fast and responsive.
- If the campaign is locked, disable Generate and show a locked banner.

Generation gallery behavior:
- Responsive grid:
  - 1 column on mobile
  - 2 columns on tablet
  - 3 or 4 columns on desktop
- Each card should show:
  - video or thumbnail
  - status
  - generation number
  - cost
  - audio on/off
  - retry index
- If status failed:
  - show error state
  - preserve the failed attempt in history
- If status succeeded:
  - allow click to open a larger viewer modal

Design goals:
- Clean B2B SaaS aesthetic
- Friendly but not playful
- Fast decision-making UI
- Minimal clutter
- Suitable for small business owners and professionals
- Strong visual hierarchy
- Accessible contrast and keyboard navigation

Data model expected from API:
Use JSON like this for campaign detail:
{
  "id": "cmp_123",
  "name": "Spring Promo",
  "status": "active",
  "triesAllowed": 5,
  "retryCount": 2,
  "videosPerTry": 1,
  "totalClipsAllotted": 5,
  "durationSeconds": 20,
  "aspectRatio": "16:9",
  "audioEnabled": false,
  "selectedStylePreset": "cute_isometric",
  "productName": "fitness coaching",
  "headline": "Train smarter, not harder",
  "cta": "Book now",
  "brandName": "Acme",
  "brandColors": ["#111111", "#FFFFFF"],
  "logoUrl": "...",
  "generations": [
    {
      "id": "gen_1",
      "status": "succeeded",
      "outputUrl": "...",
      "thumbnailUrl": "...",
      "costCredits": 100,
      "costUSD": 1.00,
      "retryIndex": 1,
      "audioEnabled": false,
      "createdAt": "..."
    }
  ]
}

Frontend implementation requirements:
- Use TypeScript types for all API responses.
- Create a typed API client in /lib/api.ts.
- Create hooks:
  - useCampaigns
  - useCampaign
  - useCreateCampaign
  - useGenerateVideo
- Use error boundaries and loading states.
- Add skeleton loaders for the gallery and dashboard.
- Add toast notifications for success/failure.
- Keep network code isolated from presentational components.
- Support route transitions using Next.js Link.
- Persist selected style while editing the same campaign.

Folder structure to generate:
- /app/dashboard/page.tsx
- /app/campaigns/new/page.tsx
- /app/campaigns/[id]/page.tsx
- /app/campaigns/[id]/gallery/page.tsx
- /components/campaign/*
- /components/ui/*
- /lib/api.ts
- /lib/types.ts
- /lib/stylePresets.ts
- /hooks/*

Implementation details:
- Build reusable style preset data from a shared constants file.
- Show cost summary using backend-calculated values only.
- Do not recalculate final cost in the frontend.
- Use audioEnabled toggle but default it to false.
- Show a note that audio generation can be enabled later.
- Make locked campaigns visually obvious.
- Use accessible buttons and form fields.
- Ensure all action buttons are keyboard navigable.

Output:
Generate the complete frontend code with file paths and contents.
Make sure the code is production-ready, easy to maintain, and consistent with the backend JSON contract.
```

If you want, I can also make a third Cursor prompt for the **design system / Tailwind UI components** so the app looks consistent from day one.
<span style="display:none">[^8_10][^8_3][^8_4][^8_5][^8_6][^8_7][^8_8][^8_9]</span>

<div align="center">⁂</div>

[^8_1]: https://nextjs.org/docs/app/guides

[^8_2]: https://reactform.co/blog/nextjs-form

[^8_3]: https://docs.imgix.com/en-US/getting-started/tutorials/responsive-design/how-to-build-a-responsive-image-gallery-in-react

[^8_4]: https://medium.com/@vigneshuthra/how-i-structure-real-world-next-js-apps-using-the-app-router-2025-edition-58a5c8f447fb

[^8_5]: https://tryhoverify.com/blog/building-a-responsive-grid-gallery-with-tailwind-and-react/

[^8_6]: https://feature-sliced.design/blog/nextjs-app-router-guide

[^8_7]: https://github.com/mikeKlech/react-gallery-grid

[^8_8]: https://www.youtube.com/watch?v=RnKSA-51kpI

[^8_9]: https://www.youtube.com/watch?v=RBM03RihZVs

[^8_10]: https://www.youtube.com/watch?v=R2DovdNt2n0


---

# yes but im using Vercel for deployment UI

Yes — with Vercel deployment, the frontend prompt should explicitly use **Next.js App Router on Vercel**, server components for data loading, client components only for interactive controls, and route handlers/server actions for mutations. Vercel documents Next.js as a full-stack framework deployment target, and its discussion guidance confirms that Route Handlers in the App Router become serverless functions on Vercel.[^9_1][^9_2]

Use this Cursor prompt for your Vercel-hosted frontend:

```text
You are building the frontend for a Vercel-hosted Next.js 14+ app using the App Router.

Deployment target:
- Vercel
- Next.js App Router
- Server Components for data fetching
- Client Components only for forms, style selectors, modals, tabs, toggles, and interactive gallery controls
- Route Handlers / Server Actions for mutations
- Use environment variables correctly for Vercel runtime

Goal:
Build a polished frontend for an AI ad generation app where users:
- create campaigns
- select a single visual style preset from curated cards
- enter minimal ad details
- see remaining tries
- generate videos
- view all outputs in a gallery
- hit a locked state after 5 tries
- buy a new campaign when locked

Vercel-specific implementation requirements:
1. Use `process.env` only in server-side code.
2. Do not depend on non-public env vars in client components.
3. For any API base URL or provider key, read it in Route Handlers, Server Actions, or server utilities only.
4. Keep the UI calling your own `/api/...` endpoints, not the external provider directly.
5. If a page needs dynamic data, prefer server rendering with `cache: 'no-store'` only where necessary.
6. Make static or cached UI parts reusable, but keep campaign data dynamic.

Pages to build:
- `/app/dashboard/page.tsx`
- `/app/campaigns/new/page.tsx`
- `/app/campaigns/[id]/page.tsx`
- `/app/campaigns/[id]/gallery/page.tsx`

UI components:
- `CampaignForm`
- `StylePresetGrid`
- `StylePresetCard`
- `GenerationGallery`
- `GenerationCard`
- `RemainingTriesBadge`
- `LockedCampaignBanner`
- `CostSummary`
- `VideoViewerModal`
- shared UI primitives

Design goals:
- Clean SaaS layout
- Fast and simple for small business users
- Limited choices, no overwhelming options
- Strong conversion-oriented hierarchy
- Accessible contrast and keyboard support
- Responsive on mobile, tablet, desktop

Style preset behavior:
- Render the reference presets as cards.
- Only one preset can be selected at a time.
- Keep the style data in a shared `lib/stylePresets.ts`.
- Show:
  - label
  - short description
  - category
  - thumbnail/preview
  - selected state
- Keep style selection extremely fast.

Ad flow behavior:
- Campaign has exactly 5 tries.
- Show remaining tries at all times.
- Show total allotted clips.
- Lock generation when tries are exhausted.
- Preserve all generations in the history.
- Show failures as part of the gallery, not hidden.
- Show a CTA to buy a new campaign when locked.

Forms:
- Use React Hook Form + Zod.
- Validate:
  - productName
  - headline
  - cta
  - brandName
  - selectedStylePreset
- Keep the form minimal.
- Audio toggle should default to off.
- Add helper text explaining that audio can be enabled later.
- Use one-click save/generate actions where possible.

Gallery behavior:
- Use a responsive grid.
- Mobile: 1 column.
- Tablet: 2 columns.
- Desktop: 3–4 columns.
- Each card should display:
  - preview thumbnail or video
  - status
  - cost
  - retry number
  - audio on/off
  - timestamp
- Failed cards should show the error message.
- Success cards should open a modal viewer.
- Add loading skeletons for gallery and dashboard.

Data contract:
Use JSON from the backend, do not recompute pricing in the frontend.

Campaign shape:
{
  "id": "cmp_123",
  "name": "Spring Promo",
  "status": "active",
  "triesAllowed": 5,
  "retryCount": 2,
  "videosPerTry": 1,
  "totalClipsAllotted": 5,
  "durationSeconds": 20,
  "aspectRatio": "16:9",
  "audioEnabled": false,
  "selectedStylePreset": "cute_isometric",
  "productName": "fitness coaching",
  "headline": "Train smarter, not harder",
  "cta": "Book now",
  "brandName": "Acme",
  "brandColors": ["#111111", "#FFFFFF"],
  "logoUrl": "...",
  "generations": []
}

Generation shape:
{
  "id": "gen_1",
  "status": "succeeded",
  "outputUrl": "...",
  "thumbnailUrl": "...",
  "costCredits": 100,
  "costUSD": 1.00,
  "retryIndex": 1,
  "audioEnabled": false,
  "createdAt": "..."
}

Implementation details:
- Create a typed API client in `lib/api.ts`.
- Create React Query or SWR hooks:
  - useCampaigns
  - useCampaign
  - useCreateCampaign
  - useGenerateVideo
- Keep network logic out of presentational components.
- Use reusable cards and buttons.
- Use toasts for success/failure.
- Use route transitions with `next/link`.
- Use modals only for previewing generated clips.
- Keep the main CTA obvious and above the fold.
- Make locked campaigns visually prominent.

Vercel hosting constraints:
- Keep all provider secrets in server-only files.
- Keep all generation requests server-side.
- Keep uploads or generated assets referenced by URL.
- If using file storage, design it so Vercel Blob or another storage provider can be swapped in later.
- If environment variables are needed, document them in `.env.example` and assume they are configured in Vercel dashboard for deploys.

Folder structure to generate:
- `/app/dashboard/page.tsx`
- `/app/campaigns/new/page.tsx`
- `/app/campaigns/[id]/page.tsx`
- `/app/campaigns/[id]/gallery/page.tsx`
- `/components/campaign/*`
- `/components/ui/*`
- `/lib/api.ts`
- `/lib/types.ts`
- `/lib/stylePresets.ts`
- `/hooks/*`

Output:
Generate the complete frontend code with file paths and contents, ready for deployment to Vercel.
Make it production-ready, clean, and easy to maintain.
```

If you want, I can also write the **Vercel-ready deployment checklist** next, including env vars, build settings, and the exact folder layout for the repo.
<span style="display:none">[^9_10][^9_3][^9_4][^9_5][^9_6][^9_7][^9_8][^9_9]</span>

<div align="center">⁂</div>

[^9_1]: https://github.com/orgs/vercel/discussions/4679

[^9_2]: https://vercel.com/docs/frameworks/full-stack/nextjs

[^9_3]: https://github.com/vercel/next.js/discussions/50759

[^9_4]: https://www.youtube.com/watch?v=-HSFV9ILFuk

[^9_5]: https://utan.app/@next.js/articles/clsm457kh00011133sde9l7ai

[^9_6]: https://github.com/vercel/next.js/discussions/12077

[^9_7]: https://cadence.withremote.ai/blog/vercel-blob-guide

[^9_8]: https://www.youtube.com/watch?v=lo2GmBahoyI

[^9_9]: https://github.com/vercel/next.js/discussions/44628

[^9_10]: https://nextjs.org/docs/pages/guides/environment-variables

