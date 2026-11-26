"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

export type SortOrder = "asc" | "desc";
export type Sort = { key: string; order: SortOrder } | null;

/**
 * 컬럼 정렬 상태. `<SortTh {...sorting} />`로 넘긴다. 같은 컬럼을 누르면 첫 방향 → 반대 방향 → 기본 순서(정렬 해제)로 돈다.
 * 숫자·날짜는 큰 값부터, 글자는 가나다순부터 시작한다.
 */
export function useSort(onChange?: () => void) {
  const [sort, setSort] = useState<Sort>(null);
  const onSort = (key: string, first: SortOrder) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, order: first };
      if (current.order === first) {
        return { key, order: first === "asc" ? "desc" : "asc" };
      }
      return null;
    });
    onChange?.();
  };
  return { sort, onSort };
}

/** 서버 목록 API에 넘기는 정렬 쿼리. 정렬이 없으면 서버 기본 순서. */
export function sortQuery(sort: Sort): { sort?: string; order?: SortOrder } {
  return sort ? { sort: sort.key, order: sort.order } : {};
}

/** 제목 옆 화살표 버튼. 누를 때마다 정렬이 바뀐다. */
export function SortTh({
  label,
  sortKey,
  sort,
  onSort,
  first = "desc",
  align = "left",
  className,
  bare,
}: {
  label: React.ReactNode;
  sortKey: string;
  sort: Sort;
  onSort: (key: string, first: SortOrder) => void;
  /** 처음 누를 때 방향. 숫자·날짜는 desc, 글자는 asc. */
  first?: SortOrder;
  align?: "left" | "right";
  className?: string;
  /** 공통 th 모양을 빼고 className만 쓴다. */
  bare?: boolean;
}) {
  const active = sort?.key === sortKey ? sort.order : null;
  const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <th
      className={clsx(
        !bare && "th",
        align === "right" && "text-right",
        className,
      )}
      aria-sort={
        active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey, first)}
        className={clsx(
          "group inline-flex cursor-pointer items-center gap-1 rounded hover:text-ink",
          active && "text-ink",
        )}
        title={
          active === null
            ? "정렬"
            : active === first
              ? "반대로 정렬"
              : "정렬 해제"
        }
      >
        {label}
        <Icon
          size={12}
          aria-hidden
          className={clsx(
            "shrink-0",
            active ? "text-accent" : "text-ink-mute/50 group-hover:text-ink-mute",
          )}
        />
      </button>
    </th>
  );
}

type SortValue = string | number | boolean | null | undefined;

/** 화면에서 정렬하는 목록용. 빈 값은 방향과 상관없이 맨 뒤로. */
export function sortRows<T>(
  rows: T[],
  sort: Sort,
  values: Record<string, (row: T) => SortValue>,
): T[] {
  const pick = sort ? values[sort.key] : undefined;
  if (!sort || !pick) return rows;
  const sign = sort.order === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = pick(a);
    const y = pick(b);
    const xEmpty = x === null || x === undefined || x === "";
    const yEmpty = y === null || y === undefined || y === "";
    if (xEmpty || yEmpty) return xEmpty === yEmpty ? 0 : xEmpty ? 1 : -1;
    if (typeof x === "string" && typeof y === "string") {
      return sign * x.localeCompare(y, "ko", { numeric: true });
    }
    return sign * (Number(x) - Number(y));
  });
}
