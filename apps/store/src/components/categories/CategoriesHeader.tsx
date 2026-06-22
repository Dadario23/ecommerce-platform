"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  search: string;
  setSearch: (value: string) => void;
}

export default function CategoriesHeader({ search, setSearch }: Props) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Home / eCommerce / Catalog
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search Category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button>Add Category</Button>
      </div>
    </div>
  );
}
