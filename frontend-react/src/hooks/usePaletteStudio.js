import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { generateVideo, mixAudioOnClip, applyTextOverlay } from "../lib/campaignApi"
import { buildCampaignSummary, buildNarrationScript, buildNarrationScriptVariants, narrationHintForIndustry } from "../lib/campaignSummaryBuilder"
import { publicAudioError, publicOverlayError } from "../lib/publicErrors"
import { friendlyRunwayError } from "../lib/runwayErrors.js"
import { generationPlaybackUrl, exportPlaybackUrl, generationMixSourceUrl, generationOverlaySourceUrl, generationHasPlayableClip, effectiveAdTheme } from "../lib/studioSteps"
import { loadSocialsTray, addToSocialsTray, upgradeSocialsTrayUrls } from "../lib/socialsTrayStorage"
import { pushActivity } from "../lib/activityLogStorage"
import {
  loadStudioStateFromCloud,
  saveStudioStateToCloud,
  mergeStudioState,
} from "../lib/studioCloudSync"
import { restoreSocialsTrayFromCloud } from "../lib/socialsTrayCloud"
import { marketFieldsFromSetup } from "../lib/campaignSetupStorage"
import {
  DEFAULT_STUDIO_STATE,
  countConsumedTries,
  nextRetryIndex,
  loadStudioState,
  reconcileStudioState,
  saveStudioState,
  studioKeyFromSetup,
} from "../lib/paletteStudioStorage"

function hasIndustry(state) {
  return !!(state.industryCustom?.trim() || state.industry?.trim())
}

function studioGenerations(prev) {
  return (prev && prev.generations) || []
}

function applyGenerationResult(prev, pendingId, patch, pendingFallback = null) {
  const base = prev && typeof prev === "object" ? prev : DEFAULT_STUDIO_STATE
  let gens = studioGenerations(base)
  if (!gens.some((g) => g.id === pendingId)) {
    const seed =
      pendingFallback || {
        id: pendingId,
        status: "pending",
        createdAt: new Date().toISOString(),
      }
    gens = [{ ...seed, ...patch }, ...gens]
  } else {
    gens = gens.map((g) => (g.id === pendingId ? { ...g, ...patch } : g))
  }
  return reconcileStudioState({
    ...base,
    generations: gens,
    retryCount: countConsumedTries(gens),
  })
}

function handleRefundedTry({ pendingId, setState, setTryRestoredFlash, remaining, total }) {
  setTryRestoredFlash(true)
  setTimeout(() => setTryRestoredFlash(false), 3000)

  setTimeout(() => {
    setState((prev) => {
      const base = prev && typeof prev === "object" ? prev : DEFAULT_STUDIO_STATE
      return reconcileStudioState({
        ...base,
        generations: studioGenerations(base).filter((g) => g.id !== pendingId),
      })
    })
  }, 3500)

  return {
    type: "restored",
    message: `Try failed — no try was used. ${remaining} of ${total} tries left.`,
  }
}

export function usePaletteStudio(campaignSetup, userId) {
  const storageKey = useMemo(() => studioKeyFromSetup(campaignSetup), [campaignSetup])

  const [state, setState] = useState(() => loadStudioState(storageKey))
  const [generating, setGenerating] = useState(false)
  const [mixingAudio, setMixingAudio] = useState(false)
  const [applyingOverlay, setApplyingOverlay] = useState(false)
  const [generateStartedAt, setGenerateStartedAt] = useState(null)
  const [toast, setToast] = useState(null)
  const [tryRestoredFlash, setTryRestoredFlash] = useState(false)
  const [narrationPulseAt, setNarrationPulseAt] = useState(0)
  const [scriptPickerOpen, setScriptPickerOpen] = useState(false)
  const [scriptVariants, setScriptVariants] = useState([])
  const [scriptVariantIndex, setScriptVariantIndex] = useState(0)
  const [studioReady, setStudioReady] = useState(false)
  const [hydratedKey, setHydratedKey] = useState(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const persistCloudNow = useCallback(
    async (nextState) => {
      if (!userId) return { ok: false, error: "Not signed in" }
      const snapshot = nextState && typeof nextState === "object" ? nextState : stateRef.current
      saveStudioState(storageKey, snapshot)
      return saveStudioStateToCloud(userId, storageKey, snapshot, loadSocialsTray(storageKey))
    },
    [userId, storageKey]
  )

  useEffect(() => {
    let cancelled = false
    setStudioReady(false)
    setHydratedKey(null)
    const local = loadStudioState(storageKey)
    setState(local)

    async function hydrate() {
      if (!userId) {
        if (!cancelled) {
          setState(local)
          setHydratedKey(storageKey)
          setStudioReady(true)
        }
        return
      }

      const remote = await loadStudioStateFromCloud(userId, storageKey)
      if (cancelled) return

      if (remote?.state) {
        const merged = mergeStudioState(local, remote.state)
        setState(merged)
        saveStudioState(storageKey, merged)
        restoreSocialsTrayFromCloud(storageKey, remote.socials_tray)
        const { changed } = upgradeSocialsTrayUrls(storageKey, merged.generations)
        if (changed) {
          window.dispatchEvent(new CustomEvent("neonsox-socials-tray-updated"))
        }
        await saveStudioStateToCloud(userId, storageKey, merged, loadSocialsTray(storageKey))
      } else {
        setState(local)
        const { changed } = upgradeSocialsTrayUrls(storageKey, local.generations)
        if (changed) {
          window.dispatchEvent(new CustomEvent("neonsox-socials-tray-updated"))
        }
        if (countConsumedTries(local.generations) > 0) {
          await saveStudioStateToCloud(userId, storageKey, local, loadSocialsTray(storageKey))
        }
      }

      setHydratedKey(storageKey)
      setStudioReady(true)
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [storageKey, userId])

  useEffect(() => {
    saveStudioState(storageKey, state)
    if (!userId) return undefined
    const timer = setTimeout(() => {
      saveStudioStateToCloud(userId, storageKey, state, loadSocialsTray(storageKey))
    }, 1000)
    return () => clearTimeout(timer)
  }, [storageKey, state, userId])

  useEffect(() => {
    if (!userId) return undefined
    const onTrayUpdate = () => {
      saveStudioStateToCloud(userId, storageKey, state, loadSocialsTray(storageKey))
    }
    window.addEventListener("neonsox-socials-tray-updated", onTrayUpdate)
    return () => window.removeEventListener("neonsox-socials-tray-updated", onTrayUpdate)
  }, [userId, storageKey, state])

  useEffect(() => {
    const onLeave = () => {
      if (!userId) return
      persistCloudNow(stateRef.current)
    }
    window.addEventListener("beforeunload", onLeave)
    return () => window.removeEventListener("beforeunload", onLeave)
  }, [userId, persistCloudNow])

  const industryLabel = (state.industryCustom || state.industry || "").trim()

  useEffect(() => {
    if (!hasIndustry(state) || state.narrationScriptEdited) return
    const suggested = buildNarrationScript(state)
    if (!suggested || suggested === state.narrationScript) return
    setState((prev) => ({ ...prev, narrationScript: suggested }))
  }, [
    industryLabel,
    state.companyName,
    state.deadlineOffer,
    state.adTone,
    state.adThemeCustom,
    state.adThemeMode,
    state.narrationScriptEdited,
  ])

  const narrationHint = narrationHintForIndustry(industryLabel, state.adTone, effectiveAdTheme(state))

  const briefForScripts = useCallback(
    (prev) => ({
      industry: prev.industryCustom || prev.industry || "",
      industryCustom: prev.industryCustom || prev.industry || "",
      companyName: prev.companyName || prev.brandName || "",
      brandName: prev.companyName || prev.brandName || "",
      deadlineOffer: prev.deadlineOffer || "",
      adTone: prev.adTone || "",
      adThemeMode: prev.adThemeMode,
      adThemeCustom: prev.adThemeCustom || "",
      adTheme: effectiveAdTheme(prev),
    }),
    []
  )

  const openScriptPicker = useCallback(() => {
    setState((prev) => {
      const variants = buildNarrationScriptVariants(briefForScripts(prev))
      if (!variants.length) {
        setToast({ type: "error", message: "Pick an industry in Step 1 first." })
        setTimeout(() => setToast(null), 4000)
        return prev
      }

      const currentIdx = variants.findIndex(
        (v) => v.script.trim().toLowerCase() === (prev.narrationScript || "").trim().toLowerCase()
      )

      setScriptVariants(variants)
      setScriptVariantIndex(currentIdx >= 0 ? currentIdx : 0)
      setScriptPickerOpen(true)
      setToast({
        type: "success",
        message: `${variants.length} ideas ready — browse, then tap Select this idea. Your box below stays active until you do.`,
      })
      setTimeout(() => setToast(null), 5000)
      return prev
    })
  }, [briefForScripts])

  const prevScriptVariant = useCallback(() => {
    setScriptVariantIndex((i) => (i <= 0 ? scriptVariants.length - 1 : i - 1))
  }, [scriptVariants.length])

  const nextScriptVariant = useCallback(() => {
    setScriptVariantIndex((i) => (i >= scriptVariants.length - 1 ? 0 : i + 1))
  }, [scriptVariants.length])

  const applyScriptVariant = useCallback(() => {
    const picked = scriptVariants[scriptVariantIndex]
    if (!picked) return

    setState((prev) => ({
      ...prev,
      narrationScript: picked.script,
      narrationScriptEdited: true,
    }))
    setNarrationPulseAt(Date.now())
    setScriptPickerOpen(false)
    setToast({ type: "success", message: "Idea selected — this is now your active script." })
    setTimeout(() => setToast(null), 4000)
  }, [scriptVariantIndex, scriptVariants])

  const closeScriptPicker = useCallback(() => {
    setScriptPickerOpen(false)
  }, [])

  useEffect(() => {
    if (!scriptPickerOpen) return
    const variants = buildNarrationScriptVariants(briefForScripts(state))
    if (!variants.length) return
    setScriptVariants(variants)
    setScriptVariantIndex(0)
  }, [state.adTone, state.adThemeCustom, state.adThemeMode, scriptPickerOpen, state, briefForScripts])

  const suggestNarration = openScriptPicker

  const updateNarrationScript = useCallback((text) => {
    setState((prev) => ({
      ...prev,
      narrationScript: text,
      narrationScriptEdited: true,
    }))
  }, [])

  const remainingTries = Math.max(
    0,
    state.triesAllowed - countConsumedTries(studioGenerations(state))
  )
  const isLocked = remainingTries <= 0
  const studioHydrating = !studioReady || hydratedKey !== storageKey
  const showLocked = studioReady && hydratedKey === storageKey && isLocked

  const patch = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const briefComplete =
    hasIndustry(state) &&
    state.targetAudience.trim() &&
    effectiveAdTheme(state) &&
    state.adTone &&
    state.themeSetting

  const canGenerate =
    studioReady &&
    hydratedKey === storageKey &&
    !isLocked &&
    !generating &&
    !mixingAudio &&
    briefComplete &&
    state.selectedStylePreset &&
    state.companyName.trim()

  const selectedGeneration =
    studioGenerations(state).find((g) => g.id === state.selectedGenerationId) || null

  const canMixAudio =
    generationHasPlayableClip(selectedGeneration) &&
    !!state.narrationScript?.trim() &&
    !mixingAudio &&
    !applyingOverlay &&
    selectedGeneration?.audioMixStatus !== "pending"

  const canSkipTextOverlay =
    generationHasPlayableClip(selectedGeneration) &&
    !applyingOverlay &&
    !mixingAudio &&
    selectedGeneration?.textOverlayStatus !== "pending" &&
    selectedGeneration?.textOverlaySkipped !== true

  const canApplyTextOverlay =
    generationHasPlayableClip(selectedGeneration) &&
    !applyingOverlay &&
    !mixingAudio &&
    selectedGeneration?.textOverlayStatus !== "pending" &&
    (!!state.companyName.trim() ||
      (!!selectedGeneration?.brandedOutputUrl && selectedGeneration?.textOverlayStatus === "succeeded"))

  const generate = useCallback(async () => {
    if (!canGenerate) return

    const retryIndex = nextRetryIndex(studioGenerations(state), state.triesAllowed)
    const pendingId = `gen_${Date.now()}`

    const pending = {
      id: pendingId,
      status: "pending",
      retryIndex,
      costCredits: null,
      costUSD: null,
      createdAt: new Date().toISOString(),
      error: null,
      audioMixStatus: null,
      finalOutputUrl: null,
    }

    setState((prev) => ({
      ...(prev && typeof prev === "object" ? prev : DEFAULT_STUDIO_STATE),
      generations: [pending, ...studioGenerations(prev)],
    }))
    setGenerating(true)
    const startedAt = Date.now()
    setGenerateStartedAt(startedAt)

    try {
      const built = buildCampaignSummary({ ...state, ...marketFieldsFromSetup(campaignSetup) })
      const marketFields = marketFieldsFromSetup(campaignSetup)
      const result = await generateVideo(storageKey, {
        userId,
        generationId: pendingId,
        selectedStylePreset: state.selectedStylePreset,
        productName: built.productName,
        brandName: state.companyName.trim(),
        brandColors: state.brandColors,
        logoUrl: state.logoUrl,
        durationSeconds: 10,
        aspectRatio: "16:9",
        retryIndex,
        preventAiMistakes: state.preventAiMistakes !== false,
        brief: {
          industry: state.industryCustom || state.industry,
          adTone: state.adTone,
          themeSetting: state.themeSetting,
          adTheme: effectiveAdTheme(state),
          ...marketFields,
        },
      })

      const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000)
      const refunded = !!result.refundTry
      let restoredMeta = null

      const nextState = applyGenerationResult(stateRef.current, pendingId, {
        status: result.status,
        outputUrl: result.outputUrl || null,
        cloudOutputUrl: result.cloudOutputUrl || null,
        thumbnailUrl: result.thumbnailUrl || null,
        costCredits: result.costCredits,
        costUSD: result.costUSD,
        error: friendlyRunwayError(result.error, { refundTry: refunded }) || result.error || null,
        refunded,
        elapsedSeconds,
      }, pending)

      if (refunded) {
        restoredMeta = {
          remaining: Math.max(0, nextState.triesAllowed - countConsumedTries(nextState.generations)),
          total: nextState.triesAllowed,
        }
      }

      setState(nextState)

      if (result.status === "succeeded" || !refunded) {
        await persistCloudNow(nextState)
      }

      if (restoredMeta) {
        setToast(
          handleRefundedTry({
            pendingId,
            setState,
            setTryRestoredFlash,
            remaining: restoredMeta.remaining,
            total: restoredMeta.total,
          })
        )
      } else if (result.status === "succeeded") {
        const mins = Math.floor(elapsedSeconds / 60)
        const secs = elapsedSeconds % 60
        const timeLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
        setToast({
          type: "success",
          message: `Clip ready in ${timeLabel}. Watch the silent preview — if you already see words, generate again before adding your company name.`,
        })
      } else if (!refunded) {
        setToast({
          type: "error",
          message: friendlyRunwayError(result.error, { refundTry: false }) || "Generation failed.",
        })
      }
    } catch (err) {
      const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000)
      const refunded = !!err.refundTry
      let restoredMeta = null

      const failedState = applyGenerationResult(stateRef.current, pendingId, {
        status: "failed",
        error: friendlyRunwayError(err.message, { refundTry: refunded }) || err.message || "Network error",
        refunded,
        elapsedSeconds,
      }, pending)

      if (refunded) {
        restoredMeta = {
          remaining: Math.max(0, failedState.triesAllowed - countConsumedTries(failedState.generations)),
          total: failedState.triesAllowed,
        }
      }

      setState(failedState)

      if (!refunded) {
        await persistCloudNow(failedState)
      }

      if (restoredMeta) {
        setToast(
          handleRefundedTry({
            pendingId,
            setState,
            setTryRestoredFlash,
            remaining: restoredMeta.remaining,
            total: restoredMeta.total,
          })
        )
      } else if (!refunded) {
        setToast({
          type: "error",
          message: friendlyRunwayError(err.message, { refundTry: false }) || "Could not reach generation service.",
        })
      }
    } finally {
      setGenerating(false)
      setGenerateStartedAt(null)
      setTimeout(() => setToast(null), 6000)
    }
  }, [canGenerate, state, storageKey, userId, campaignSetup, persistCloudNow])

  const selectGeneration = useCallback((id) => {
    setState((prev) => {
      const gen = studioGenerations(prev).find((g) => g.id === id)
      if (!gen || gen.status !== "succeeded") return prev
      const script = buildNarrationScript(prev) || prev.narrationScript
      return {
        ...prev,
        selectedGenerationId: id,
        narrationScript: script,
        narrationScriptEdited: false,
      }
    })
    setToast({ type: "success", message: "Ad chosen — add voice & music (Step 4) or on-screen text (Step 6)." })
    setTimeout(() => setToast(null), 5000)
  }, [])

  const deselectGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedGenerationId: null,
    }))
    setToast({
      type: "success",
      message: "Pick cleared — open any clip and tap “This is my ad” when you are ready.",
    })
    setTimeout(() => setToast(null), 5000)
  }, [])

  const mixAudio = useCallback(async () => {
    if (!canMixAudio || !selectedGeneration) return

    const genId = selectedGeneration.id
    setMixingAudio(true)

    setState((prev) => ({
      ...prev,
      generations: studioGenerations(prev).map((g) =>
        g.id === genId ? { ...g, audioMixStatus: "pending", audioMixError: null } : g
      ),
    }))

    try {
      const result = await mixAudioOnClip(storageKey, {
        userId,
        generationId: genId,
        videoUrl: generationMixSourceUrl(selectedGeneration),
        narrationText: state.narrationScript.trim(),
        voiceStyle: state.voiceStyle,
        voiceGender: state.voiceGender,
        musicMood: state.musicMood,
        musicVolume: state.musicVolume,
        adTone: state.adTone,
      })

      setState((prev) => {
        const nextGenerations = studioGenerations(prev).map((g) =>
          g.id === genId
            ? {
                ...g,
                audioMixStatus: result.status,
                finalOutputUrl: result.finalOutputUrl || null,
                cloudFinalOutputUrl: result.cloudFinalOutputUrl || null,
                usedMusic: result.usedMusic,
                appliedMusicVolume: result.musicVolume ?? state.musicVolume,
                appliedVoiceStyle: result.voiceStyle ?? state.voiceStyle,
                appliedVoiceGender: result.voiceGender ?? state.voiceGender,
                audioMixError: null,
                exportedToSocials: false,
                ...(g.brandedOutputUrl
                  ? {
                      brandedOutputUrl: null,
                      textOverlayStatus: null,
                      textOverlayError: null,
                      appliedOverlayStyle: null,
                      appliedCompanyName: null,
                      exportedToSocials: false,
                      textOverlaySkipped: false,
                    }
                  : {}),
              }
            : g
        )
        const next = { ...prev, generations: nextGenerations }
        if (result.status === "succeeded") {
          persistCloudNow(next)
        }
        return next
      })

      if (result.status === "succeeded") {
        const hadOverlay = !!selectedGeneration.brandedOutputUrl
        setToast({
          type: "success",
          message: hadOverlay
            ? "Voice & music updated. Tap Update in Palette Editor to refresh your company name."
            : "Voice & music ready.",
        })
      } else {
        setToast({ type: "error", message: result.error || "Audio mix failed." })
      }
    } catch (err) {
      const friendly = publicAudioError(err.message)
      setState((prev) => ({
        ...prev,
        generations: studioGenerations(prev).map((g) =>
          g.id === genId
            ? { ...g, audioMixStatus: "failed", audioMixError: friendly }
            : g
        ),
      }))
      setToast({ type: "error", message: friendly })
    } finally {
      setMixingAudio(false)
      setTimeout(() => setToast(null), 6000)
    }
  }, [canMixAudio, selectedGeneration, state, storageKey, userId, persistCloudNow])

  const burnTextOverlay = useCallback(async () => {
    if (!canApplyTextOverlay || !selectedGeneration) return

    const genId = selectedGeneration.id
    const trimmedName = state.companyName.trim()
    const hadBranded =
      selectedGeneration.textOverlayStatus === "succeeded" && selectedGeneration.brandedOutputUrl

    if (!trimmedName && hadBranded) {
      setState((prev) => ({
        ...prev,
        generations: studioGenerations(prev).map((g) =>
          g.id === genId
            ? {
                ...g,
                brandedOutputUrl: null,
                textOverlayStatus: null,
                textOverlayError: null,
                appliedOverlayStyle: null,
                appliedCompanyName: null,
                textOverlaySkipped: false,
              }
            : g
        ),
      }))
      setToast({ type: "success", message: "Company name removed from this ad." })
      setTimeout(() => setToast(null), 5000)
      return
    }

    if (!trimmedName) return

    const sourceUrl = generationOverlaySourceUrl(selectedGeneration)

    setApplyingOverlay(true)

    setState((prev) => ({
      ...prev,
      generations: studioGenerations(prev).map((g) =>
        g.id === genId
          ? {
              ...g,
              textOverlayStatus: "pending",
              textOverlayError: null,
              brandedOutputUrl: null,
              cloudBrandedOutputUrl: null,
            }
          : g
      ),
    }))

    const flashSeconds = [2, 4, 6].includes(Number(state.overlayFlashAt))
      ? Number(state.overlayFlashAt)
      : 4

    try {
      const result = await applyTextOverlay(storageKey, {
        userId,
        generationId: genId,
        videoUrl: sourceUrl,
        companyName: trimmedName,
        overlayStyle: {
          color: state.overlayColor,
          size: state.overlaySize,
          position: state.overlayPosition,
          pulse: state.overlayPulse,
          fontStyle: state.overlayFontStyle,
          flashSeconds,
        },
      })

      setState((prev) => {
        const nextGenerations = studioGenerations(prev).map((g) =>
          g.id === genId
            ? {
                ...g,
                textOverlayStatus: result.status,
                brandedOutputUrl: result.brandedOutputUrl || null,
                cloudBrandedOutputUrl: result.cloudBrandedOutputUrl || null,
                textOverlayError: null,
                appliedOverlayStyle: {
                  overlayColor: state.overlayColor,
                  overlaySize: state.overlaySize,
                  overlayPosition: state.overlayPosition,
                  overlayPulse: state.overlayPulse,
                  overlayFontStyle: state.overlayFontStyle,
                  overlayFlashAt: state.overlayFlashAt,
                },
                appliedCompanyName: trimmedName,
                textOverlaySkipped: false,
                exportedToSocials: false,
              }
            : g
        )
        const next = { ...prev, generations: nextGenerations }
        if (result.status === "succeeded") {
          persistCloudNow(next)
        }
        return next
      })

      if (result.status === "succeeded") {
        const secs = result.flashSeconds ?? flashSeconds
        setToast({
          type: "success",
          message: `Text on screen for ${secs} seconds — scrub the preview to verify timing.`,
        })
      } else {
        setToast({ type: "error", message: result.error || "Text overlay failed." })
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        generations: studioGenerations(prev).map((g) =>
          g.id === genId
            ? { ...g, textOverlayStatus: "failed", textOverlayError: publicOverlayError(err.message) }
            : g
        ),
      }))
      setToast({ type: "error", message: publicOverlayError(err.message) })
    } finally {
      setApplyingOverlay(false)
      setTimeout(() => setToast(null), 6000)
    }
  }, [canApplyTextOverlay, selectedGeneration, state, storageKey, userId, persistCloudNow])

  const skipTextOverlay = useCallback(() => {
    if (!selectedGeneration || !canSkipTextOverlay) return

    const genId = selectedGeneration.id
    setState((prev) => ({
      ...prev,
      generations: studioGenerations(prev).map((g) =>
        g.id === genId
          ? {
              ...g,
              brandedOutputUrl: null,
              textOverlayStatus: null,
              textOverlayError: null,
              appliedOverlayStyle: null,
              appliedCompanyName: null,
              textOverlaySkipped: true,
              exportedToSocials: false,
            }
          : g
      ),
    }))
    setToast({ type: "success", message: "Step 6 complete — no on-screen text." })
    setTimeout(() => setToast(null), 5000)
  }, [canSkipTextOverlay, selectedGeneration])

  const exportToSocials = useCallback(() => {
    if (!selectedGeneration) return
    const hasFinishedAd =
      selectedGeneration.textOverlaySkipped === true || !!selectedGeneration.brandedOutputUrl
    if (!hasFinishedAd) return
    const videoUrl = exportPlaybackUrl(selectedGeneration)
    if (!videoUrl) return
    const cloudVideoUrl =
      selectedGeneration.cloudBrandedOutputUrl || selectedGeneration.cloudFinalOutputUrl || null

    addToSocialsTray(storageKey, {
      id: selectedGeneration.id,
      generationId: selectedGeneration.id,
      videoUrl,
      cloudVideoUrl,
      companyName: state.companyName.trim(),
      industry: state.industryCustom || state.industry,
      voiceStyle: state.voiceStyle,
      musicMood: state.musicMood,
      ...marketFieldsFromSetup(campaignSetup),
    })

    pushActivity(storageKey, { type: "export", message: "Exported finished ad to Socials Tray." })

    setState((prev) => ({
      ...prev,
      generations: studioGenerations(prev).map((g) =>
        g.id === selectedGeneration.id ? { ...g, exportedToSocials: true } : g
      ),
    }))
    setToast({ type: "success", message: "Exported to Socials Tray!" })
    setTimeout(() => setToast(null), 5000)

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("neonsox-socials-tray-updated"))
      window.dispatchEvent(new CustomEvent("neonsox-scroll-socials-tray"))
    }
  }, [selectedGeneration, state.companyName, state.industry, state.industryCustom, state.voiceStyle, state.musicMood, storageKey, campaignSetup])

  const resetForNewCampaign = useCallback(() => {
    setState({ ...DEFAULT_STUDIO_STATE })
  }, [])

  return {
    state,
    patch,
    remainingTries,
    isLocked,
    showLocked,
    studioReady,
    studioHydrating,
    canGenerate,
    canMixAudio,
    canApplyTextOverlay,
    generating,
    mixingAudio,
    applyingOverlay,
    generateStartedAt,
    generate,
    selectGeneration,
    deselectGeneration,
    mixAudio,
    burnTextOverlay,
    skipTextOverlay,
    canSkipTextOverlay,
    exportToSocials,
    suggestNarration,
    updateNarrationScript,
    narrationHint,
    narrationPulseAt,
    scriptPickerOpen,
    scriptVariants,
    scriptVariantIndex,
    prevScriptVariant,
    nextScriptVariant,
    applyScriptVariant,
    closeScriptPicker,
    selectedGeneration,
    resetForNewCampaign,
    toast,
    tryRestoredFlash,
  }
}
