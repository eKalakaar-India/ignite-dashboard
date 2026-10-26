import React from 'react'
import Card, { CardHeader } from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import { BarChart3 } from 'lucide-react'

export default function ChartCard({ title, subtitle, icon, accent, action, children, isEmpty, className = '' }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} icon={icon} accent={accent} action={action} />
      {isEmpty ? (
        <EmptyState icon={BarChart3} title="No data for this selection" message="Try widening the filters or reporting period." />
      ) : (
        children
      )}
    </Card>
  )
}
