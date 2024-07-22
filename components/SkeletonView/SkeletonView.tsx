import { ReactNode } from "react"
import { ThemedView } from "../ThemedView"

export default function SkeletonView({ isLoading, children }: { isLoading: boolean, children: ReactNode }) {
  if (isLoading) {
    return
  }
  return (
    <ThemedView>{children}</ThemedView>
  )
}