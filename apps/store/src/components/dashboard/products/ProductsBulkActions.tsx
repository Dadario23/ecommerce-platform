import { Check, X, Trash2 } from "lucide-react";

interface ProductsBulkActionsProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

export function ProductsBulkActions({ selectedCount, onActivate, onDeactivate, onDelete }: ProductsBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3 bg-blue-50 border-b border-blue-100">
      <span className="text-xs font-semibold text-blue-800">
        {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
      </span>
      <div className="flex gap-2 sm:ml-auto">
        <button
          onClick={onActivate}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-emerald-200 text-emerald-700 bg-white rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Activar
        </button>
        <button
          onClick={onDeactivate}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Desactivar
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-red-200 text-red-600 bg-white rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
