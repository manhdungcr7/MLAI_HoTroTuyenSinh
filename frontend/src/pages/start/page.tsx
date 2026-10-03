import React from "react";
import { Wizard } from "@/features/start/Wizard";
import { useApp } from "@/state/AppContext";

export default function StartPage() {
  const { epoch } = useApp();
  return <Wizard key={epoch} />;
}
