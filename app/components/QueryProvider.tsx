"use client"

import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/app/lib/query-client";

type TQueryProviderProps = { children: ReactNode }
type TQueryProvider = (props: TQueryProviderProps) => ReactNode

export const QueryProvider: TQueryProvider = ({ children }) => {
	return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
}
