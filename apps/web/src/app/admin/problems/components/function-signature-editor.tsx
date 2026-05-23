"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

// Supported types for parameters and return values
const PARAM_TYPES = [
  { value: "integer", label: "Integer" },
  { value: "string", label: "String" },
  { value: "boolean", label: "Boolean" },
  { value: "float", label: "Float" },
  { value: "integer[]", label: "Integer Array" },
  { value: "string[]", label: "String Array" },
] as const;

export type ParamType = (typeof PARAM_TYPES)[number]["value"];

export interface Parameter {
  id: string;
  name: string;
  type: ParamType;
}

export interface FunctionSignature {
  fnName: string;
  params: Parameter[];
  returnType: ParamType;
}

interface FunctionSignatureEditorProps {
  value?: FunctionSignature;
  onChange: (signature: FunctionSignature) => void;
}

// Maps our generic types to language-specific types
const TYPE_MAP = {
  py: {
    integer: "int",
    string: "str",
    boolean: "bool",
    float: "float",
    "integer[]": "List[int]",
    "string[]": "List[str]",
  },
  js: {
    integer: "number",
    string: "string",
    boolean: "boolean",
    float: "number",
    "integer[]": "number[]",
    "string[]": "string[]",
  },
  java: {
    integer: "int",
    string: "String",
    boolean: "boolean",
    float: "double",
    "integer[]": "int[]",
    "string[]": "String[]",
  },
  cpp: {
    integer: "int",
    string: "string",
    boolean: "bool",
    float: "double",
    "integer[]": "vector<int>",
    "string[]": "vector<string>",
  },
  c: {
    integer: "int",
    string: "char*", // Simplified
    boolean: "int",
    float: "double",
    "integer[]": "int*", // Simplified
    "string[]": "char**",
  },
};

export function FunctionSignatureEditor({
  value,
  onChange,
}: FunctionSignatureEditorProps) {
  const [fnName, setFnName] = useState(value?.fnName || "solution");
  const [params, setParams] = useState<Parameter[]>(
    value?.params || [{ id: "1", name: "nums", type: "integer[]" }],
  );
  const [returnType, setReturnType] = useState<ParamType>(
    value?.returnType || "integer[]",
  );

  // Update parent when state changes
  useEffect(() => {
    onChange({ fnName, params, returnType });
  }, [fnName, params, returnType]); // eslint-disable-line react-hooks/exhaustive-deps

  const addParam = () => {
    setParams([
      ...params,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: `arg${params.length + 1}`,
        type: "integer",
      },
    ]);
  };

  const removeParam = (id: string) => {
    setParams(params.filter((p) => p.id !== id));
  };

  const updateParam = (id: string, field: keyof Parameter, val: string) => {
    setParams(params.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Function Name</Label>
          <Input
            value={fnName}
            onChange={(e) => setFnName(e.target.value)}
            placeholder="e.g. twoSum"
          />
        </div>
        <div className="space-y-2">
          <Label>Return Type</Label>
          <Select
            value={returnType}
            onValueChange={(val) => setReturnType(val as ParamType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARAM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Parameters</Label>
          <Button type="button" variant="outline" size="sm" onClick={addParam}>
            <Plus className="mr-2 h-4 w-4" />
            Add Parameter
          </Button>
        </div>

        <div className="space-y-3">
          {params.map((param, index) => (
            <div key={param.id} className="flex items-end gap-3">
              <div className="text-muted-foreground w-10 pt-3 text-center text-sm">
                {index + 1}.
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-muted-foreground text-xs">Name</Label>
                <Input
                  value={param.name}
                  onChange={(e) =>
                    updateParam(param.id, "name", e.target.value)
                  }
                  placeholder="arg name"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-muted-foreground text-xs">Type</Label>
                <Select
                  value={param.type}
                  onValueChange={(val) =>
                    updateParam(param.id, "type", val as ParamType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeParam(param.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="bg-muted/50 text-muted-foreground rounded-md p-4 font-mono text-xs">
        <div className="mb-2 font-semibold">Preview (Python):</div>
        <div>
          class Solution:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;def {fnName}(self,{" "}
          {params
            .map((p) => `${p.name}: ${TYPE_MAP.py?.[p.type] || "Any"}`)
            .join(", ")}
          ) -&gt; {TYPE_MAP.py?.[returnType] || "Any"}:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Your code here
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pass
        </div>
      </div>
    </div>
  );
}
