/**
 * RichEmailComposer.js
 **/

import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  Box, IconButton, Tooltip, Divider, Popover,
  TextField, Button, Typography,
} from "@mui/material";

// ── Toolbar button descriptor ─────────────────────────────────────────────────
const ToolBtn = ({ title, onClick, active, children, disabled }) => (
  <Tooltip title={title} arrow placement="top">
    <span>
      <IconButton
        size="small"
        disabled={disabled}
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        sx={{
          borderRadius: "6px",
          width: 28,
          height: 28,
          color: active ? "#fff" : "#1A005D",
          backgroundColor: active ? "#1A005D" : "transparent",
          "&:hover": { backgroundColor: active ? "#3a0099" : "#e8e3f8" },
          fontSize: "13px",
          fontWeight: "bold",
          fontFamily: "inherit",
          transition: "all 0.15s",
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

// ── Emoji list (common set) ───────────────────────────────────────────────────
const EMOJIS = [
  "😀","😄","😂","🤣","😊","😍","🥳","🎉","🚀","✅","⚠️","❌","💡","🔥",
  "📧","📋","📅","🕐","🏢","📍","💻","🎯","💬","🙌","👏","🤝","💪","🌟",
  "⭐","🏆","🎓","📚","✏️","🔔","💼","🗓️","📊","📈","✈️","🌏","🇮🇳",
];

// ── Colour swatches ───────────────────────────────────────────────────────────
const COLOURS = [
  "#000000","#1A005D","#8EC400","#e53935","#1565c0","#2e7d32",
  "#f57f17","#6a1b9a","#00838f","#4e342e","#546e7a","#ffffff",
];

// ─────────────────────────────────────────────────────────────────────────────
export default function RichEmailComposer({ value, onChange }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const isInternalChange = useRef(false);

  // Anchor states for popover pickers
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [fgAnchor, setFgAnchor]       = useState(null);
  const [bgAnchor, setBgAnchor]       = useState(null);
  const [linkAnchor, setLinkAnchor]   = useState(null);
  const [linkUrl, setLinkUrl]         = useState("https://");

  // Saved selection range for restoring after popover opens
  const savedRange = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    if (!savedRange.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange.current);
  };

  // Sync external value → editor (only on mount or external reset)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    if (el.innerHTML !== (value || "")) el.innerHTML = value || "";
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const exec = (cmd, arg = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  // ── Image handling ────────────────────────────────────────────────────────
  const insertImageFromFile = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      restoreSelection();
      exec("insertHTML", `<img src="${e.target.result}" style="max-width:100%;border-radius:6px;margin:4px 0;" alt="inserted image"/>`);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        insertImageFromFile(item.getAsFile());
        return;
      }
    }
    // Default paste — let browser handle text/html naturally
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) insertImageFromFile(file);
  };

  // ── Link insertion ────────────────────────────────────────────────────────
  const openLinkPopover = (e) => {
    saveSelection();
    setLinkUrl("https://");
    setLinkAnchor(e.currentTarget);
  };
  const insertLink = () => {
    restoreSelection();
    if (linkUrl && linkUrl !== "https://") exec("createLink", linkUrl);
    setLinkAnchor(null);
  };

  // ── Emoji insertion ───────────────────────────────────────────────────────
  const insertEmoji = (emoji) => {
    restoreSelection();
    exec("insertText", emoji);
    setEmojiAnchor(null);
  };

  // ── Colour pickers ────────────────────────────────────────────────────────
  const applyFgColour = (colour) => {
    restoreSelection();
    exec("foreColor", colour);
    setFgAnchor(null);
  };
  const applyBgColour = (colour) => {
    restoreSelection();
    exec("hiliteColor", colour);
    setBgAnchor(null);
  };

  // ── Colour swatch grid ────────────────────────────────────────────────────
  const ColourGrid = ({ onSelect }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 24px)", gap: "4px", p: 1.5 }}>
      {COLOURS.map((c) => (
        <Box key={c} onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
          sx={{ width: 24, height: 24, backgroundColor: c, borderRadius: "4px", cursor: "pointer",
            border: c === "#ffffff" ? "1px solid #ccc" : "1px solid transparent",
            "&:hover": { transform: "scale(1.2)", boxShadow: "0 0 0 2px #8EC400" },
            transition: "all 0.1s" }} />
      ))}
    </Box>
  );

  // ── Section divider ───────────────────────────────────────────────────────
  const TB_DIVIDER = (
    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "#d0cbeb" }} />
  );

  return (
    <Box sx={{ border: "1.5px solid #8EC400", borderRadius: "10px", overflow: "hidden", backgroundColor: "#fff" }}>

      {/* ── Toolbar ── */}
      <Box sx={{
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.25,
        px: 1, py: 0.75, backgroundColor: "#f0eaff", borderBottom: "1px solid #d0cbeb",
      }}>

        {/* Text formatting */}
        <ToolBtn title="Bold" onClick={() => exec("bold")}><b>B</b></ToolBtn>
        <ToolBtn title="Italic" onClick={() => exec("italic")}><i>I</i></ToolBtn>
        <ToolBtn title="Underline" onClick={() => exec("underline")}><u>U</u></ToolBtn>
        <ToolBtn title="Strikethrough" onClick={() => exec("strikeThrough")}><s>S</s></ToolBtn>

        {TB_DIVIDER}

        {/* Headings */}
        <ToolBtn title="Heading 1" onClick={() => exec("formatBlock", "H2")}>H1</ToolBtn>
        <ToolBtn title="Heading 2" onClick={() => exec("formatBlock", "H3")}>H2</ToolBtn>
        <ToolBtn title="Normal text" onClick={() => exec("formatBlock", "P")}>¶</ToolBtn>

        {TB_DIVIDER}

        {/* Alignment */}
        <ToolBtn title="Align Left"   onClick={() => exec("justifyLeft")}>⬅</ToolBtn>
        <ToolBtn title="Align Centre" onClick={() => exec("justifyCenter")}>↔</ToolBtn>
        <ToolBtn title="Align Right"  onClick={() => exec("justifyRight")}>➡</ToolBtn>

        {TB_DIVIDER}

        {/* Lists */}
        <ToolBtn title="Bullet list"   onClick={() => exec("insertUnorderedList")}>• —</ToolBtn>
        <ToolBtn title="Numbered list" onClick={() => exec("insertOrderedList")}>1.</ToolBtn>
        <ToolBtn title="Indent"        onClick={() => exec("indent")}>→|</ToolBtn>
        <ToolBtn title="Outdent"       onClick={() => exec("outdent")}>|←</ToolBtn>

        {TB_DIVIDER}

        {/* Font colour */}
        <Tooltip title="Font colour" arrow placement="top">
          <Box onMouseDown={(e) => { e.preventDefault(); saveSelection(); setFgAnchor(e.currentTarget); }}
            sx={{ display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer",
              px: 0.5, py: 0.25, borderRadius:"6px", "&:hover":{ backgroundColor:"#e8e3f8" } }}>
            <Typography sx={{ fontSize:"13px", fontWeight:"bold", color:"#1A005D", lineHeight:1 }}>A</Typography>
            <Box sx={{ width:18, height:4, backgroundColor:"#e53935", borderRadius:1, mt:"1px" }} />
          </Box>
        </Tooltip>
        <Popover open={Boolean(fgAnchor)} anchorEl={fgAnchor} onClose={() => setFgAnchor(null)}
          anchorOrigin={{ vertical:"bottom", horizontal:"left" }}>
          <ColourGrid onSelect={applyFgColour} />
        </Popover>

        {/* Highlight colour */}
        <Tooltip title="Highlight colour" arrow placement="top">
          <Box onMouseDown={(e) => { e.preventDefault(); saveSelection(); setBgAnchor(e.currentTarget); }}
            sx={{ display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer",
              px: 0.5, py: 0.25, borderRadius:"6px", "&:hover":{ backgroundColor:"#e8e3f8" } }}>
            <Typography sx={{ fontSize:"11px", fontWeight:"bold", color:"#1A005D", lineHeight:1 }}>⬛</Typography>
            <Box sx={{ width:18, height:4, backgroundColor:"#f9c74f", borderRadius:1, mt:"1px" }} />
          </Box>
        </Tooltip>
        <Popover open={Boolean(bgAnchor)} anchorEl={bgAnchor} onClose={() => setBgAnchor(null)}
          anchorOrigin={{ vertical:"bottom", horizontal:"left" }}>
          <ColourGrid onSelect={applyBgColour} />
        </Popover>

        {TB_DIVIDER}

        {/* Link */}
        <ToolBtn title="Insert link" onClick={openLinkPopover}>🔗</ToolBtn>
        <Popover open={Boolean(linkAnchor)} anchorEl={linkAnchor} onClose={() => setLinkAnchor(null)}
          anchorOrigin={{ vertical:"bottom", horizontal:"left" }}>
          <Box sx={{ p: 1.5, display:"flex", gap:1, alignItems:"center", minWidth: 280 }}>
            <TextField size="small" label="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && insertLink()}
              sx={{ flex:1, "& .MuiOutlinedInput-root":{ fontSize:"13px" } }} />
            <Button size="small" variant="contained" onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
              sx={{ backgroundColor:"#1A005D", "&:hover":{ backgroundColor:"#8EC400", color:"#1A005D" } }}>
              Add
            </Button>
          </Box>
        </Popover>

        {/* Image upload */}
        <ToolBtn title="Insert image" onClick={() => { saveSelection(); fileInputRef.current?.click(); }}>🖼</ToolBtn>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImageFromFile(f); e.target.value = ""; }} />

        {TB_DIVIDER}

        {/* Emoji picker */}
        <ToolBtn title="Insert emoji"
          onClick={(e) => { /* handled via onMouseDown in wrapper */ }}
          children="😊"
        />
        {/* Override to capture anchor */}
        <Box sx={{ display:"none" }} /> {/* spacer — actual emoji btn below */}
        <Tooltip title="Insert emoji" arrow placement="top">
          <IconButton size="small"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); setEmojiAnchor(e.currentTarget); }}
            sx={{ borderRadius:"6px", width:28, height:28, fontSize:"16px",
              "&:hover":{ backgroundColor:"#e8e3f8" } }}>
            😊
          </IconButton>
        </Tooltip>
        <Popover open={Boolean(emojiAnchor)} anchorEl={emojiAnchor} onClose={() => setEmojiAnchor(null)}
          anchorOrigin={{ vertical:"bottom", horizontal:"left" }}>
          <Box sx={{ display:"grid", gridTemplateColumns:"repeat(10, 32px)", gap:"2px", p:1.5 }}>
            {EMOJIS.map((em) => (
              <Box key={em} onMouseDown={(e) => { e.preventDefault(); insertEmoji(em); }}
                sx={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"18px", cursor:"pointer", borderRadius:"6px",
                  "&:hover":{ backgroundColor:"#e8e3f8" } }}>
                {em}
              </Box>
            ))}
          </Box>
        </Popover>

        {TB_DIVIDER}

        {/* Undo / Redo */}
        <ToolBtn title="Undo (Ctrl+Z)" onClick={() => exec("undo")}>↩</ToolBtn>
        <ToolBtn title="Redo (Ctrl+Y)" onClick={() => exec("redo")}>↪</ToolBtn>

        {TB_DIVIDER}

        {/* Clear formatting */}
        <ToolBtn title="Remove formatting" onClick={() => exec("removeFormat")}>✕ fmt</ToolBtn>
      </Box>

      {/* ── Editable area ── */}
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        data-placeholder="Write your email body here…&#10;&#10;Supports rich text, images (paste or upload), emojis, links, and full formatting."
        sx={{
          minHeight: 220,
          maxHeight: 420,
          overflowY: "auto",
          p: "14px 16px",
          outline: "none",
          fontSize: "14px",
          fontFamily: "inherit",
          lineHeight: 1.75,
          color: "#1a1a2e",
          "& h2": { fontSize:"20px", fontWeight:700, color:"#1A005D", mt:1.5, mb:0.5 },
          "& h3": { fontSize:"16px", fontWeight:600, color:"#3a0099", mt:1, mb:0.5 },
          "& p":  { margin:"4px 0" },
          "& ul, & ol": { paddingLeft:"24px", margin:"6px 0" },
          "& a":  { color:"#1565c0", textDecoration:"underline" },
          "& img":{ maxWidth:"100%", borderRadius:"6px", margin:"6px 0", display:"block" },
          // Placeholder via CSS attr trick
          "&:empty::before": {
            content: "attr(data-placeholder)",
            color: "#aaa",
            fontStyle: "italic",
            whiteSpace: "pre-line",
            pointerEvents: "none",
          },
        }}
      />

      {/* ── Footer hint ── */}
      <Box sx={{ px: 2, py: 0.75, backgroundColor: "#f9fff0", borderTop: "1px solid #d9efb5",
        display:"flex", alignItems:"center", gap:1 }}>
        <Typography variant="caption" sx={{ color:"#5a8a00" }}>
          💡 Tip: Paste images directly, drag-and-drop them, or use 🖼 to upload. Ctrl+B / I / U shortcuts work too.
        </Typography>
      </Box>
    </Box>
  );
}