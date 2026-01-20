"use client";

import { useMemo } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

interface TestCase {
  input: string;
  output: string;
  isPublic: boolean;
}

interface TestCasesTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  signature?: any; // FunctionSignature type (lazy typing to avoid import cycles or strictness issues)
}

const DraggableRow = ({ row }: { row: Row<TestCase & { id: string }> }) => {
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: row.original.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform), //let dnd-kit handle translation
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn("bg-background", isDragging && "shadow-md")}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
          {/* Render the drag handle only for the drag-handle column, or attach listeners to the specific cell */}
          {cell.column.id === "drag-handle" ? (
            <div
              {...attributes}
              {...listeners}
              className="cursor-move text-muted-foreground/50 hover:text-foreground"
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>

          ) : flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};

export function TestCasesTable({ control, name, signature }: TestCasesTableProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
  });

  const data = useMemo(() => fields as unknown as (TestCase & { id: string })[], [fields]);

  const columns = useMemo<ColumnDef<TestCase & { id: string }>[]>(
    () => {
      const baseCols: ColumnDef<TestCase & { id: string }>[] = [
        {
          id: "drag-handle",
          header: "",
          size: 40,
          cell: () => <GripVertical className="h-4 w-4" />,
        },
        // Dynamic Input Column(s)
        ...(signature && signature.params
          ? signature.params.map((param: any, pIndex: number) => ({
            accessorKey: `args.${pIndex}`,
            header: `${param.name} (${param.type})`,
            cell: ({ row }: any) => {
              const index = row.index;
              return (
                <FormField
                  control={control}
                  name={`${name}.${index}.args.${pIndex}`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <Textarea
                          placeholder={param.name}
                          className="min-h-[2.5rem] py-1.5 text-xs font-mono leading-relaxed resize-y"
                          rows={1}
                          {...field}
                          value={field.value || ""} // Ensure controlled
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              );
            },
          }))
          : [
            {
              accessorKey: "input",
              header: "Input",
              cell: ({ row, table }: any) => {
                const index = row.index;
                return (
                  <FormField
                    control={control}
                    name={`${name}.${index}.input`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Textarea
                            placeholder="Input"
                            className="min-h-[2.5rem] py-1.5 text-xs font-mono leading-relaxed resize-y"
                            rows={1}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                );
              },
            },
          ]),
        {
          accessorKey: "output", // Mopup for both 'output' and 'expected'
          header: signature ? "Expected Output" : "Output",
          cell: ({ row }) => {
            const index = row.index;
            return (
              <FormField
                control={control}
                name={`${name}.${index}.${signature ? "expected" : "output"}`}
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Textarea
                        placeholder={signature ? "Expected Return Value" : "Output"}
                        className="min-h-[2.5rem] py-1.5 text-xs font-mono leading-relaxed resize-y"
                        rows={1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            )
          },
        },
        {
          id: "actions",
          header: "Actions",
          size: 80,
          cell: ({ row }) => {
            const index = row.index;
            return (
              <div className="flex items-center gap-1">
                <FormField
                  control={control}
                  name={`${name}.${index}.isPublic`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
                            field.value
                              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                          title={field.value ? "Public Test Case" : "Hidden Test Case"}
                        >
                          {field.value ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                  title="Remove Test Case"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        },
      ];
      return baseCols;
    },
    [control, name, remove, signature]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);
      move(oldIndex, newIndex);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {fields.length} Test Cases
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ input: "", output: "", isPublic: false })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Test Case
        </Button>
      </div>
      <div className="rounded-md border">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <SortableContext
                items={data.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
