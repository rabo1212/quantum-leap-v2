"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
            🔍
          </span>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="분석할 코인을 입력하세요 (예: BTC, 이더리움, SOL)"
            className="pl-12 h-14 text-lg bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="h-14 px-8 text-lg rounded-xl bg-primary hover:bg-primary/90 font-semibold"
        >
          {isLoading ? (
            <span className="animate-pulse-slow">분석 중...</span>
          ) : (
            "분석하기"
          )}
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-3">
        예: BTC, ETH, SOL, 비트코인, 이더리움, 도지코인, PEPE, SUI
      </p>
    </form>
  );
}
