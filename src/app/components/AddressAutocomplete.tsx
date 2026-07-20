"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AddressSuggestion } from "@/lib/nominatim";

interface AddressAutocompleteProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectAddress: (suggestion: AddressSuggestion) => void;
  className?: string;
  required?: boolean;
  countryCodes?: string;
  placeholder?: string;
}

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

export default function AddressAutocomplete({
  id,
  name,
  value,
  onChange,
  onSelectAddress,
  className = "form-control",
  required,
  countryCodes = "ca",
  placeholder,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams({ q: trimmed });
      if (countryCodes) params.set("countryCodes", countryCodes);

      fetch(`/api/geocode?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { results?: AddressSuggestion[] }) => {
          const results = data.results ?? [];
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setHighlightedIndex(-1);
        })
        .catch((error) => {
          if (error?.name === "AbortError") return;
          setSuggestions([]);
          setIsOpen(false);
        });
    }, DEBOUNCE_MS);
  }, [value, countryCodes]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(suggestion: AddressSuggestion) {
    onSelectAddress(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="position-relative" ref={containerRef}>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={className}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listboxId}
      />
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="list-group position-absolute w-100 shadow-sm"
          style={{ zIndex: 1060, top: "100%" }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <button
                type="button"
                className={`list-group-item list-group-item-action${
                  index === highlightedIndex ? " active" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion.displayName}
              </button>
            </li>
          ))}
          <li className="list-group-item small text-body-secondary">
            Search by{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </li>
        </ul>
      )}
    </div>
  );
}
