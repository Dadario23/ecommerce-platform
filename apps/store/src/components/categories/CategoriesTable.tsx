"use client";

import CategoryRow from "./CategoryRow";
import CategoryCard from "./CategoryCard";

interface Props {
  categories: {
    id: number;
    name: string;
    description: string;
    type: string;
    image: string;
  }[];
}

export default function CategoriesTable({ categories }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-left">
            <tr>
              <th className="p-4">Category</th>
              <th className="p-4">Category Type</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 p-3 md:hidden">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}
