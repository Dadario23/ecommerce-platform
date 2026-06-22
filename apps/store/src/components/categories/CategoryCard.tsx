"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  category: {
    id: number;
    name: string;
    description: string;
    type: string;
    image: string;
  };
}

export default function CategoryCard({ category }: Props) {
  return (
    <div className="flex items-start justify-between gap-3 bg-white border rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Image
          src={category.image}
          alt={category.name}
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">
            {category.description}
          </p>
          <Badge
            variant="outline"
            className={
              category.type === "Automated"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }
          >
            {category.type}
          </Badge>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
