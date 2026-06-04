import * as React from "react";

import { cn } from "~/lib/utils";

function Table({
  className,
  ref,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}
Table.displayName = "Table";

function TableHeader({
  className,
  ref,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  );
}
TableHeader.displayName = "TableHeader";

function TableBody({
  className,
  ref,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}
TableBody.displayName = "TableBody";

function TableFooter({
  className,
  ref,
  ...props
}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      ref={ref}
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}
TableFooter.displayName = "TableFooter";

function TableRow({
  className,
  ref,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      ref={ref}
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}
TableRow.displayName = "TableRow";

function TableHead({
  className,
  ref,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      ref={ref}
      className={cn(
        "text-muted-foreground h-10 px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}
TableHead.displayName = "TableHead";

function TableCell({
  className,
  ref,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      ref={ref}
      className={cn(
        "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}
TableCell.displayName = "TableCell";

function TableCaption({
  className,
  ref,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      ref={ref}
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
