import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import Wordmark from "../components/Wordmark"
import CountryFlag from "../components/CountryFlag"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import {
  MARKET_COUNTRIES,
  MARKET_BY_ID,
  MARKET_REGIONS,
  SORTED_MARKET_COUNTRIES,
  countryRequiresRegion,
  languagesForMarkets,
  regionsForCountry,
  sortedMarketCountries,
} from "../lib/marketCountries"
import { loadCampaignSetup, saveCampaignSetup } from "../lib/campaignSetupStorage"
import { saveCampaignSetupToSupabase } from "../lib/campaignSetupSync"

import WorldMapSvg, { WORLD_MAP_ASPECT } from "../components/WorldMapSvg"

function WorldMap({ colors, selectedIds, homeCountry, onPinClick, hoveredId, setHoveredId, isDark }) {
  const landFill = isDark ? "#5d7a8c" : "#9eb3c2"
  const oceanFill = isDark ? "#071018" : "#1b4d6e"
  const stroke = isDark ? "#7fa3b8" : "#4a6578"

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: WORLD_MAP_ASPECT,
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        background: oceanFill,
      }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <WorldMapSvg landFill={landFill} oceanFill={oceanFill} stroke={stroke} />
      </div>

      {MARKET_COUNTRIES.map((country) => {
        const isHome = homeCountry === country.id
        const isTarget = selectedIds.includes(country.id)
        const isHovered = hoveredId === country.id
        const active = isHome || isTarget

        return (
          <button
            key={country.id}
            type="button"
            title={country.label}
            onClick={() => onPinClick(country.id)}
            onMouseEnter={() => setHoveredId(country.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "absolute",
              left: `${country.map.x}%`,
              top: `${country.map.y}%`,
              transform: "translate(-50%, -50%)",
              width: isHovered || active ? "14px" : "10px",
              height: isHovered || active ? "14px" : "10px",
              borderRadius: "50%",
              border: `2px solid ${isHome ? colors.accent : active ? "#4ade80" : "#ffffff"}`,
              background: isHome
                ? colors.accent
                : isTarget
                  ? "rgba(74, 222, 128, 0.9)"
                  : isHovered
                    ? colors.accentSoft
                    : "rgba(255,255,255,0.75)",
              cursor: "pointer",
              padding: 0,
              boxShadow: active ? `0 0 12px ${isHome ? colors.accent : "#4ade80"}` : "none",
              transition: "all 0.15s ease",
              zIndex: isHovered ? 3 : active ? 2 : 1,
            }}
          />
        )
      })}
    </div>
  )
}

export default function MarketSelector() {
  const { colors, isDark } = useTheme()
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()

  const initial = useMemo(() => loadCampaignSetup(), [])

  const [homeCountry, setHomeCountry] = useState(initial.homeCountry || "")
  const [homeRegion, setHomeRegion] = useState(initial.homeRegion || "")
  const [targetMarkets, setTargetMarkets] = useState(initial.targetMarkets || [])
  const [selectedLanguages, setSelectedLanguages] = useState(initial.selectedLanguages || [])
  const [worldwideMarkets, setWorldwideMarkets] = useState(initial.worldwideMarkets || false)
  const [hoveredId, setHoveredId] = useState(null)
  const [filter, setFilter] = useState("")
  const [savedFlash, setSavedFlash] = useState(false)
  const [mapView, setMapView] = useState("earth")

  const suggestedLanguages = useMemo(() => {
    if (worldwideMarkets) {
      return languagesForMarkets(MARKET_COUNTRIES.map((c) => c.id))
    }
    const ids = [...new Set([homeCountry, ...targetMarkets].filter(Boolean))]
    return languagesForMarkets(ids)
  }, [homeCountry, targetMarkets, worldwideMarkets])

  const filteredCountries = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const pool = q
      ? MARKET_COUNTRIES.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.region.toLowerCase().includes(q) ||
            c.languages.some((l) => l.toLowerCase().includes(q))
        )
      : MARKET_COUNTRIES
    return sortedMarketCountries(pool)
  }, [filter])

  const goBack = () => {
    navigate("/dashboard", { state: { activeTab: "palette", scrollTo: "palette-editor" } })
  }

  const toggleTarget = (id) => {
    if (worldwideMarkets) return
    setTargetMarkets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const onPinClick = (id) => {
    if (worldwideMarkets) return
    toggleTarget(id)
  }

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const syncLanguagesFromMarkets = () => {
    setSelectedLanguages(suggestedLanguages)
  }

  const homeRegionOptions = useMemo(() => regionsForCountry(homeCountry), [homeCountry])
  const showHomeRegion = countryRequiresRegion(homeCountry)

  const onHomeCountryChange = (countryId) => {
    setHomeCountry(countryId)
    if (!countryRequiresRegion(countryId)) {
      setHomeRegion("")
    } else {
      setHomeRegion((prev) => {
        const options = regionsForCountry(countryId)
        return options.includes(prev) ? prev : ""
      })
    }
  }

  const handleSave = async () => {
    const setup = loadCampaignSetup()
    const nextSetup = {
      ...setup,
      homeCountry,
      homeRegion: showHomeRegion ? homeRegion : "",
      targetMarkets: worldwideMarkets ? [] : targetMarkets,
      selectedLanguages:
        selectedLanguages.length > 0 ? selectedLanguages : suggestedLanguages,
      worldwideMarkets,
    }
    if (user?.id) {
      await saveCampaignSetupToSupabase(user.id, nextSetup)
    } else {
      saveCampaignSetup(nextSetup)
    }
    setSavedFlash(true)
    setTimeout(() => {
      setSavedFlash(false)
      goBack()
    }, 600)
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: colors.bg }}>
        <span style={{ color: colors.textMuted }}>Loading…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    navigate("/login")
    return null
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: colors.bg,
      color: colors.text,
      fontFamily: "inherit",
    },
    header: {
      position: "relative",
      padding: "16px 24px 28px",
      borderBottom: `1px solid ${colors.border}`,
      background: colors.surface,
      textAlign: "center",
    },
    headerSide: {
      position: "absolute",
      top: "16px",
    },
    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
      background: colors.surfaceAlt,
      color: colors.text,
      fontWeight: 700,
      fontSize: "0.9rem",
      cursor: "pointer",
    },
    main: {
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "24px",
      display: "grid",
      gridTemplateColumns: "280px 1fr 300px",
      gap: "20px",
      alignItems: "start",
    },
    panel: {
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      padding: "16px",
      background: colors.surfaceAlt,
    },
    label: {
      fontSize: "0.72rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: colors.textFaint,
      marginBottom: "8px",
      display: "block",
    },
    input: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.text,
      fontSize: "0.85rem",
      boxSizing: "border-box",
    },
    countryRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      padding: "8px",
      borderRadius: "8px",
      border: "1px solid transparent",
      cursor: "pointer",
      marginBottom: "4px",
    },
    chip: {
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "0.68rem",
      fontWeight: 600,
      marginRight: "4px",
      marginBottom: "4px",
    },
    saveBtn: {
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "none",
      background: colors.accent,
      color: "#fff",
      fontWeight: 800,
      fontSize: "1rem",
      cursor: "pointer",
      marginTop: "16px",
    },
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button
          type="button"
          style={{ ...styles.backBtn, ...styles.headerSide, left: "24px" }}
          onClick={goBack}
        >
          ← Palette Schema
        </button>
        <div style={{ position: "absolute", top: "16px", right: "24px" }}>
          <ThemeToggle />
        </div>

        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            paddingTop: "4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Wordmark size="1.85rem" withTM />
          <h1
            style={{
              margin: "14px 0 8px",
              fontSize: "1.45rem",
              color: colors.text,
              fontWeight: 700,
            }}
          >
            Choose your markets
          </h1>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: "0.9rem", lineHeight: 1.45 }}>
            Tap countries on the map or pick from the list. Languages update with your selection.
          </p>
        </div>
      </header>

      <div style={styles.main}>
        <div style={styles.panel}>
          <label style={styles.label} htmlFor="home-country">
            Your home country
          </label>
          <select
            id="home-country"
            style={{ ...styles.input, marginBottom: showHomeRegion ? "8px" : "16px" }}
            value={homeCountry}
            onChange={(e) => onHomeCountryChange(e.target.value)}
          >
            <option value="">Select home country…</option>
            {SORTED_MARKET_COUNTRIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flagCode} · {c.label}
              </option>
            ))}
          </select>

          {showHomeRegion ? (
            <>
              <label style={styles.label} htmlFor="home-region">
                State / Province
              </label>
              <select
                id="home-region"
                style={{ ...styles.input, marginBottom: "16px" }}
                value={homeRegion}
                onChange={(e) => setHomeRegion(e.target.value)}
              >
                <option value="">Select state or province…</option>
                {homeRegionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={worldwideMarkets}
              onChange={(e) => {
                setWorldwideMarkets(e.target.checked)
                if (e.target.checked) setTargetMarkets([])
              }}
            />
            Entire world market
          </label>

          <label style={{ ...styles.label, marginTop: "16px" }} htmlFor="market-search">
            Search markets
          </label>
          <input
            id="market-search"
            style={{ ...styles.input, marginBottom: "12px" }}
            placeholder="Country or language…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {filteredCountries.map((country) => {
              const checked = targetMarkets.includes(country.id)
              const isHome = homeCountry === country.id
              return (
                <div
                  key={country.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !worldwideMarkets && toggleTarget(country.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      if (!worldwideMarkets) toggleTarget(country.id)
                    }
                  }}
                  style={{
                    ...styles.countryRow,
                    background: checked ? colors.accentSoft : "transparent",
                    borderColor: checked ? colors.accent : "transparent",
                    opacity: worldwideMarkets ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={worldwideMarkets}
                    readOnly
                    style={{ marginTop: "3px" }}
                  />
                  <CountryFlag flagCode={country.flagCode} height={18} style={{ marginTop: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: colors.text }}>
                      {country.label}
                      {isHome ? (
                        <span style={{ color: colors.accent, marginLeft: "6px", fontSize: "0.68rem" }}>
                          HOME
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: colors.textMuted }}>
                      {country.languages.join(" · ")}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={() => setMapView("earth")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: `1px solid ${mapView === "earth" ? colors.accent : colors.border}`,
                background: mapView === "earth" ? colors.accentSoft : colors.surface,
                color: mapView === "earth" ? colors.accent : colors.textMuted,
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Earth map
            </button>
            <button
              type="button"
              onClick={() => setMapView("list")}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: `1px solid ${mapView === "list" ? colors.accent : colors.border}`,
                background: mapView === "list" ? colors.accentSoft : colors.surface,
                color: mapView === "list" ? colors.accent : colors.textMuted,
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              List only
            </button>
          </div>

          {mapView === "earth" ? (
            <WorldMap
              colors={colors}
              isDark={isDark}
              selectedIds={worldwideMarkets ? MARKET_COUNTRIES.map((c) => c.id) : targetMarkets}
              homeCountry={homeCountry}
              onPinClick={onPinClick}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
            />
          ) : (
            <div
              style={{
                padding: "24px 20px",
                borderRadius: "16px",
                border: `1px dashed ${colors.border}`,
                background: colors.surfaceAlt,
                color: colors.textMuted,
                fontSize: "0.88rem",
                lineHeight: 1.55,
                textAlign: "center",
              }}
            >
              Map hidden — use the <strong style={{ color: colors.text }}>country list</strong> on the left
              to pick home country and target markets. Switch back to <strong>Earth map</strong> anytime.
            </div>
          )}
          {hoveredId && MARKET_BY_ID[hoveredId] ? (
            <div
              style={{
                marginTop: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "4px",
              }}
            >
              <CountryFlag flagCode={MARKET_BY_ID[hoveredId].flagCode} height={16} />
              <strong style={{ marginLeft: "8px" }}>{MARKET_BY_ID[hoveredId].label}</strong>
              <span style={{ color: colors.textFaint, marginLeft: "8px" }}>
                {MARKET_BY_ID[hoveredId].languages.join(", ")}
              </span>
            </div>
          ) : null}

          <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {MARKET_REGIONS.map((region) => {
              const ids = MARKET_COUNTRIES.filter((c) => c.region === region).map((c) => c.id)
              const allOn = ids.every((id) => targetMarkets.includes(id))
              return (
                <button
                  key={region}
                  type="button"
                  disabled={worldwideMarkets}
                  onClick={() => {
                    if (allOn) {
                      setTargetMarkets((prev) => prev.filter((id) => !ids.includes(id)))
                    } else {
                      setTargetMarkets((prev) => [...new Set([...prev, ...ids])])
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    border: `1px solid ${colors.border}`,
                    background: allOn ? colors.accentSoft : colors.surface,
                    color: colors.text,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: worldwideMarkets ? "not-allowed" : "pointer",
                    opacity: worldwideMarkets ? 0.5 : 1,
                  }}
                >
                  {allOn ? "✓ " : ""}
                  {region}
                </button>
              )
            })}
          </div>
        </div>

        <div style={styles.panel}>
          <span style={styles.label}>Ad languages</span>
          <p style={{ fontSize: "0.78rem", color: colors.textFaint, margin: "0 0 12px" }}>
            {worldwideMarkets
              ? "Worldwide — all supported languages included."
              : "Toggle languages for your ads. Suggested from your markets."}
          </p>

          <button
            type="button"
            onClick={syncLanguagesFromMarkets}
            style={{
              ...styles.backBtn,
              width: "100%",
              justifyContent: "center",
              marginBottom: "12px",
              fontSize: "0.78rem",
            }}
          >
            Sync from markets
          </button>

          <div style={{ marginBottom: "16px" }}>
            {(selectedLanguages.length ? selectedLanguages : suggestedLanguages).map((lang) => {
              const on = selectedLanguages.includes(lang)
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  style={{
                    ...styles.chip,
                    border: `1px solid ${on ? colors.accent : colors.border}`,
                    background: on ? colors.accentSoft : colors.bg,
                    color: on ? colors.accent : colors.textMuted,
                    cursor: "pointer",
                  }}
                >
                  {on ? "✓ " : ""}
                  {lang}
                </button>
              )
            })}
          </div>

          <span style={styles.label}>Selection summary</span>
          <div style={{ fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "8px" }}>
            {homeCountry ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <strong>Home:</strong>
                <CountryFlag flagCode={MARKET_BY_ID[homeCountry]?.flagCode} height={14} />
                {MARKET_BY_ID[homeCountry]?.label}
                {homeRegion ? `, ${homeRegion}` : null}
              </div>
            ) : (
              <div style={{ color: colors.textFaint }}>No home country yet</div>
            )}
            <div style={{ marginTop: "6px" }}>
              <strong>Targets:</strong>{" "}
              {worldwideMarkets
                ? "Worldwide"
                : targetMarkets.length
                  ? targetMarkets.map((id) => MARKET_BY_ID[id]?.label).join(", ")
                  : "None selected"}
            </div>
          </div>

          <button
            type="button"
            style={{
              ...styles.saveBtn,
              opacity: savedFlash ? 0.7 : 1,
            }}
            onClick={handleSave}
          >
            {savedFlash ? "Saved ✓" : "Save & return to Palette Schema"}
          </button>
        </div>
      </div>
    </div>
  )
}
