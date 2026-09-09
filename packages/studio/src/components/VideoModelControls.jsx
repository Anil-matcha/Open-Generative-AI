"use client";

import { useId } from "react";

import usePromptMenu from "./prompt/usePromptMenu.js";
import ModelParameterControls from "./ModelParameterControls.jsx";
import {
  PROMPT_CONTROL_LABEL_CLASS,
  PromptChevronIcon,
  PromptMenuItem,
  PromptPopover,
  PromptPopoverHeader,
  promptControlClassName,
} from "./prompt/PromptComposer.jsx";

const SELECT_CLASS = "w-full rounded-lg border border-white/10 bg-[#17191c] px-3 py-2 text-xs text-white outline-none focus:border-[#22d3ee]/50";
const ADVANCED_KEYS = ["seed"];

export function VideoOptionControl({ label, field, icon, open, onToggle, onSelect, copy }) {
  const controlId = useId();
  const menuId = `${controlId}-menu`;
  const { triggerRef, menuRef, onTriggerKeyDown, onMenuKeyDown, restoreFocus } = usePromptMenu({
    open, onOpen: onToggle, onClose: onToggle, selectionKey: field?.value,
  });
  if (!field) return null;
  const selected = field.options.find((option) => option.value === field.value);
  const optionLabel = (option) => field.key === "speed"
    ? copy.speeds[option.value] || option.label
    : option.label;
  const selectedLabel = selected ? optionLabel(selected) : field.label || label;
  if (field.options.length === 0 || (field.options.length === 1 && selected)) {
    if (field.key === "speed" || (field.options.length === 0 && !field.label)) return null;
    return (
      <div
        role="group"
        aria-label={`${label}: ${selectedLabel}`}
        className={promptControlClassName({ className: "pointer-events-none" })}
      >
        {icon}
        <span className="text-xs font-semibold">{selectedLabel}</span>
      </div>
    );
  }
  return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        id={controlId}
        aria-controls={menuId}
        aria-label={`${label}: ${selectedLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={onTriggerKeyDown}
        className={promptControlClassName({ active: open })}
      >
        {icon}
        <span className={PROMPT_CONTROL_LABEL_CLASS}>{selectedLabel}</span>
        <PromptChevronIcon />
      </button>
      {open && (
        <PromptPopover
          fitViewport
          solid
          className="w-[min(280px,calc(100vw-2rem))]"
          style={{ maxHeight: "60vh" }}
          onClick={(event) => event.stopPropagation()}
        >
          <PromptPopoverHeader>{label}</PromptPopoverHeader>
          <div ref={menuRef} id={menuId} role="menu" aria-labelledby={controlId} onKeyDown={onMenuKeyDown} className="flex flex-col gap-1">
            {field.options.map((option) => (
              <PromptMenuItem
                key={option.value}
                selected={field.value === option.value}
                disabled={option.disabled}
                className="disabled:opacity-40 disabled:cursor-not-allowed"
                wrapDescription
                description={(option.description || option.adjustmentDescription || option.disabled) && (
                  <span className="block">
                    {option.description}
                    {option.adjustmentDescription && (
                      <span className="block text-[#22d3ee]/75">{option.adjustmentDescription}</span>
                    )}
                    {option.disabled && <span className="block">{copy.incompatibleShort}</span>}
                  </span>
                )}
                onClick={() => {
                  onSelect(option);
                  restoreFocus();
                }}
              >
                {optionLabel(option)}
              </PromptMenuItem>
            ))}
          </div>
        </PromptPopover>
      )}
    </div>
  );
}

export function VideoSettingsControl({
  profile, qualities, quality, onProfileChange, onQualityChange, onDefaultResolution,
  inputs, values, onChange, open, onToggle, copy,
}) {
  const profileGroupId = useId();
  const profileCopy = (option) => copy.profiles[option.value] || option;
  const renderProfile = (option) => {
    const text = profileCopy(option);
    const descriptionId = `${profileGroupId}-${option.value}-description`;
    const hasDescription = text.description || option.adjustmentDescription || option.disabled;
    return (
      <label
        key={option.value}
        className={`flex items-start gap-3 rounded-lg px-3 py-2 text-xs transition-colors focus-within:ring-1 focus-within:ring-[#22d3ee]/50 ${
          option.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-white/[0.04]"
        } ${profile.value === option.value ? "bg-[#22d3ee]/[0.07]" : ""}`}
      >
        <input
          type="radio"
          name={profileGroupId}
          value={option.value}
          checked={profile.value === option.value}
          disabled={option.disabled}
          aria-label={text.label}
          aria-describedby={hasDescription ? descriptionId : undefined}
          onChange={() => onProfileChange(option.value)}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#22d3ee]"
        />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-white/80">
            {text.label}
            {option.value === "standard" && (
              <span className="text-[10px] font-medium text-white/45">{copy.defaultVariant}</span>
            )}
          </span>
          {hasDescription && (
            <span id={descriptionId} className="mt-1 block text-[11px] leading-relaxed text-white/45">
              {text.description}
              {option.adjustmentDescription && (
                <span className="block text-[#22d3ee]/75">{option.adjustmentDescription}</span>
              )}
              {option.disabled && <span className="block">{copy.incompatibleShort}</span>}
            </span>
          )}
        </span>
      </label>
    );
  };
  return (
    <ModelParameterControls
      inputs={inputs}
      values={values}
      onChange={onChange}
      open={open}
      onToggle={onToggle}
      label={copy.settings}
      title={copy.settings}
      summary=""
      fitViewport
      solid
      advancedKeys={ADVANCED_KEYS}
      advancedLabel={copy.advanced}
      advancedChildren={profile?.options.length > 1 && (
        <fieldset className="min-w-0">
          <legend className="text-xs font-semibold text-white/75">{copy.provider}</legend>
          <p className="mb-2 mt-1 text-[11px] leading-relaxed text-white/45">{copy.providerHelp}</p>
          {profile.options.map(renderProfile)}
          {onDefaultResolution && (
            <button type="button" onClick={onDefaultResolution}
              className="mt-2 px-3 py-2 text-xs text-[#22d3ee] hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#22d3ee]">
              {copy.restoreDefaultResolution}
            </button>
          )}
        </fieldset>
      )}
    >
      {qualities.length > 0 && (
        <label className="flex flex-col gap-2 text-xs text-white/75">
          <span className="font-semibold">{copy.quality}</span>
          <select aria-label={copy.quality} className={SELECT_CLASS} value={quality} onChange={(event) => onQualityChange(event.target.value)}>
            {qualities.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      )}
    </ModelParameterControls>
  );
}
