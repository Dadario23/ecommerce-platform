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

export default function CategoryRow({ category }: Props) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-4 flex items-center gap-3">
        <Image
          src={category.image}
          alt={category.name}
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">
            {category.description}
          </p>
        </div>
      </td>
      <td className="p-4">
        <Badge
          variant={category.type === "Automated" ? "default" : "secondary"}
        >
          {category.type}
        </Badge>
      </td>
      <td className="p-4 text-right">
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
      </td>
    </tr>
  );
}
