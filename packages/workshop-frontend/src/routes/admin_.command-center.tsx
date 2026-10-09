import { createFileRoute } from '@tanstack/react-router'
import CommandCenterView from '../CommandCenterView'

export const Route = createFileRoute('/admin_/command-center')({
  component: CommandCenterView,
})
