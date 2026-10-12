/**
 * SearchBar Component (U08)
 * Navbar search with keyboard navigation and recent searches.
 * Blueprint §9.7
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatNgn } from '@/lib/money';

interface SearchSuggestion {
  id: string;
  slug: string;
  name: string;
  brand_name: string;
  primary_image: string | null;
  price_from_ngn: number;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('krn:recent-searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        setActiveIndex(-1);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.ok) setSuggestions(data.data);
        } catch {
          // silent
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveAndNavigate = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;
      const updated = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 5);
      setRecentSearches(updated);
      try {
        localStorage.setItem('krn:recent-searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setIsOpen(false);
      setQuery('');
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    },
    [recentSearches],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = suggestions;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        saveAndNavigate(items[activeIndex].name);
      } else if (query.trim()) {
        saveAndNavigate(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('krn:recent-searches');
    } catch {
      // ignore
    }
  };

  const showDropdown = isOpen;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <Input
          id="site-search"
          ref={inputRef}
          type="search"
          autoComplete="off"
          placeholder="Search phones & accessories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls={showDropdown ? 'search-suggestions' : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
          }
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Clear search"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl"
        >
          {loading ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              Searching…
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((s, idx) => (
                <li key={s.id}>
                  <button
                    id={`suggestion-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onClick={() => saveAndNavigate(s.name)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50 ${
                      activeIndex === idx ? 'bg-neutral-100' : ''
                    }`}
                  >
                    {s.primary_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.primary_image}
                        alt=""
                        aria-hidden="true"
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {s.name}
                      </p>
                      <p className="text-xs text-neutral-500">{s.brand_name}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-brand-blue">
                      {formatNgn(s.price_from_ngn)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              No results for &ldquo;{query}&rdquo;.{' '}
              <a
                href={`https://wa.me/2348070822409?text=${encodeURIComponent(`Hi, do you have ${query}?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-blue hover:underline"
              >
                Ask us on WhatsApp
              </a>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="p-3">
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Recent
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Clear
                </button>
              </div>
              <ul>
                {recentSearches.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => saveAndNavigate(s)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <SearchIcon
                        className="h-3.5 w-3.5 text-neutral-400"
                        aria-hidden="true"
                      />
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-neutral-400">
              Type to search products…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
