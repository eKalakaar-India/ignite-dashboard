import React, { useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { SearchX } from 'lucide-react'

export default function DataTable({ columns, data, onRowClick, pageSize = 10, initialSort }) {
  const [sort, setSort] = useState(initialSort || { key: null, dir: 'desc' })
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort.key) return data
    const col = columns.find((c) => c.key === sort.key)
    const accessor = col?.sortAccessor || ((row) => row[sort.key])
    return [...data].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av === bv) return 0
      const result = av > bv ? 1 : -1
      return sort.dir === 'asc' ? result : -result
    })
  }, [data, sort, columns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageData = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  function toggleSort(key) {
    setPage(0)
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No matching records"
        message="Adjust your search or filters to see more activities."
      />
    )
  }

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin -mx-5 sm:mx-0">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5 sm:first:pl-0 last:pr-5 sm:last:pr-0 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer select-none hover:text-primary-700' : ''
                  }`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable &&
                      (sort.key === col.key ? (
                        sort.dir === 'asc' ? (
                          <ArrowUp size={11} />
                        ) : (
                          <ArrowDown size={11} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-300" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-50 last:border-0 transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 first:pl-5 sm:first:pl-0 last:pr-5 sm:last:pr-0 text-ink whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-600">{currentPage * pageSize + 1}</span>–
          <span className="font-semibold text-slate-600">{Math.min(sorted.length, (currentPage + 1) * pageSize)}</span> of{' '}
          <span className="font-semibold text-slate-600">{sorted.length}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-medium text-slate-500 px-2 tabular">
            {currentPage + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
