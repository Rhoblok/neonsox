import { supabase } from "./supabase"

import {

  reconcileStudioState,

  DEFAULT_STUDIO_STATE,

  countConsumedTries,

} from "./paletteStudioStorage"



export async function loadStudioStateFromCloud(userId, campaignKey) {

  if (!userId || !campaignKey) return null



  const { data, error } = await supabase

    .from("studio_states")

    .select("state, socials_tray, updated_at")

    .eq("user_id", userId)

    .eq("campaign_key", campaignKey)

    .maybeSingle()



  if (error) {

    console.warn("studio cloud load failed:", error.message)

    return null

  }



  return data

}



export async function saveStudioStateToCloud(userId, campaignKey, state, socialsTray = []) {

  if (!userId || !campaignKey) return { ok: false, error: "Not signed in" }



  const toSave = reconcileStudioState(state)



  const { error } = await supabase.from("studio_states").upsert(

    {

      user_id: userId,

      campaign_key: campaignKey,

      state: toSave,

      socials_tray: Array.isArray(socialsTray) ? socialsTray : [],

      updated_at: new Date().toISOString(),

    },

    { onConflict: "user_id,campaign_key" }

  )



  if (error) {

    console.warn("studio cloud save failed:", error.message)

    return { ok: false, error: error.message }

  }



  return { ok: true }

}



/** Richer generation wins (cloud URLs + finished pipeline beat empty/partial). */

function generationScore(gen) {

  if (!gen) return 0

  let score = 0

  if (gen.status === "succeeded") score += 100

  if (gen.cloudBrandedOutputUrl) score += 40

  if (gen.cloudFinalOutputUrl) score += 35

  if (gen.cloudOutputUrl) score += 30

  if (gen.brandedOutputUrl) score += 25

  if (gen.finalOutputUrl) score += 20

  if (gen.outputUrl) score += 15

  if (gen.audioMixStatus === "succeeded") score += 10

  return score

}



function mergeGenerations(localGens = [], remoteGens = []) {

  const byId = new Map()

  for (const g of [...remoteGens, ...localGens]) {

    const prev = byId.get(g.id)

    if (!prev || generationScore(g) >= generationScore(prev)) {

      byId.set(g.id, g)

    }

  }

  return [...byId.values()].sort(

    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()

  )

}



/** Never drop local clips when cloud row is empty or older. Union both sides. */

export function mergeStudioState(localState, remoteState) {

  const local = reconcileStudioState({ ...DEFAULT_STUDIO_STATE, ...localState })

  if (!remoteState || typeof remoteState !== "object") {

    return local

  }



  const remote = reconcileStudioState({ ...DEFAULT_STUDIO_STATE, ...remoteState })

  const localClips = countConsumedTries(local.generations)

  const remoteClips = countConsumedTries(remote.generations)

  const base = localClips >= remoteClips ? local : remote

  const generations = mergeGenerations(local.generations, remote.generations)



  const selectedGenerationId =
    base.selectedGenerationId &&
    generations.some((g) => g.id === base.selectedGenerationId)
      ? base.selectedGenerationId
      : null



  return reconcileStudioState({

    ...base,

    generations,

    selectedGenerationId,

  })

}


