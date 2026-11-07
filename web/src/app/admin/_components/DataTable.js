"use client";

import { useState } from "react";
import { getImageUrl } from "@/utils/imageUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ImageCell = ({ src, alt = "Preview" }) => {
  const [error, setError] = useState(false);
  const imageUrl = src ? getImageUrl(src) : null;

  if (!imageUrl || error) {
    return (
      <div className="size-10 bg-muted/80 rounded-xl flex items-center justify-center text-muted-foreground border border-border/60">
        <ImageIcon className="size-4 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="size-10 object-cover rounded-xl border border-border/60 bg-muted shrink-0 transition-transform duration-200 hover:scale-105"
      onError={() => setError(true)}
    />
  );
};

export default function DataTable({ columns, data, actions, className }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs", className)}>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-muted/50 border-b border-border/60">
            <TableRow className="hover:bg-transparent border-border/40">
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </TableHead>
              ))}
              {actions && (
                <TableHead className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/30">
            {data?.map((item, rowIdx) => (
              <TableRow
                key={item._id || rowIdx}
                className="hover:bg-muted/40 border-border/30 group transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={colIdx}
                    className="px-4 py-3.5 whitespace-nowrap text-sm text-foreground align-middle"
                  >
                    {col.render ? (
                      col.render(item)
                    ) : col.key === "image" ? (
                      <ImageCell src={item[col.key]} alt={item.name || "Preview"} />
                    ) : (
                      item[col.key] ?? "—"
                    )}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="px-4 py-3.5 whitespace-nowrap text-right text-sm align-middle">
                    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {actions(item)}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-16 text-center"
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    No records found
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
