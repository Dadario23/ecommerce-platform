"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MetricsSection() {
  return (
    <Card className="rounded-2xl shadow-sm border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">2,420</p>
        <p className="text-sm text-green-600">+2.8% Avg. Daily Sales</p>
      </CardContent>
    </Card>
  );
}
