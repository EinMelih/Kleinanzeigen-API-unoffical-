import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Cookie,
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface HealthStatus {
  status: string
  timestamp: string
  totalFiles: number
  validFiles: number
  expiredFiles: number
  totalCookieCount: number
  nextExpiry: string
  validityDuration: string
}

export default function Health() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchHealthStatus()
  }, [])

  const fetchHealthStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data)
      toast({
        title: "Status aktualisiert",
        description: "Health-Status erfolgreich abgerufen",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Health-Status konnte nicht abgerufen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !healthStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Server Health</h1>
        <p className="text-muted-foreground">
          Überwachung des Server-Status und Cookie-Systems
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={healthStatus?.status === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus?.status || 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Letzte Prüfung: {healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleString() : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cookie Dateien</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus?.totalFiles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {healthStatus?.validFiles || 0} gültig, {healthStatus?.expiredFiles || 0} abgelaufen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamte Cookies</CardTitle>
            <Cookie className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus?.totalCookieCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Über alle Benutzer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nächster Ablauf</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.nextExpiry ? new Date(healthStatus.nextExpiry).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthStatus?.validityDuration || 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Detaillierter Status
          </CardTitle>
          <CardDescription>
            Aktuelle Werte und Statistiken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Cookie-Übersicht</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gesamte Dateien:</span>
                  <span className="font-medium">{healthStatus?.totalFiles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gültige Dateien:</span>
                  <span className="font-medium text-green-600">{healthStatus?.validFiles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Abgelaufene Dateien:</span>
                  <span className="font-medium text-red-600">{healthStatus?.expiredFiles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gesamte Cookies:</span>
                  <span className="font-medium">{healthStatus?.totalCookieCount || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Zeit-Informationen</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Letzte Aktualisierung:</span>
                  <span className="font-medium">
                    {healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nächster Ablauf:</span>
                  <span className="font-medium">
                    {healthStatus?.nextExpiry ? new Date(healthStatus.nextExpiry).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gültigkeitsdauer:</span>
                  <span className="font-medium">{healthStatus?.validityDuration || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aktionen</CardTitle>
          <CardDescription>
            Server-Status verwalten und überwachen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={fetchHealthStatus} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Status aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System-Informationen</CardTitle>
          <CardDescription>
            Technische Details und Konfiguration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">API-Endpoints</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• GET /health - Server-Status</li>
                <li>• GET /auth/status/:email - Benutzer-Status</li>
                <li>• GET /cookies/status - Cookie-Status</li>
                <li>• GET /tokens/analyze/:email - Token-Analyse</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Echtzeit-Status-Überwachung</li>
                <li>• Cookie-Gültigkeitsprüfung</li>
                <li>• Automatische Aktualisierung</li>
                <li>• Detaillierte Statistiken</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
