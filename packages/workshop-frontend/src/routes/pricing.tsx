import { createFileRoute } from '@tanstack/react-router'
import PricingPage from '../PricingPage'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})
