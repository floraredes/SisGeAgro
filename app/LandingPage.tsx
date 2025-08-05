"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  Shield,
  Users,
  PieChart,
  Calculator,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Calendar,
  Target,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold font-sans">
                <span className="text-gray-700 font-mono">Sis</span>
                <span className="text-[#4F7942] font-mono">ge</span>
                <span className="text-gray-700 font-mono">Agro</span>
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-600 hover:text-[#4F7942] transition-colors">
                Inicio
              </a>
              <a href="#caracteristicas" className="text-gray-600 hover:text-[#4F7942] transition-colors">
                Características
              </a>
              <a href="#beneficios" className="text-gray-600 hover:text-[#4F7942] transition-colors">
                Beneficios
              </a>
              <a href="#contacto" className="text-gray-600 hover:text-[#4F7942] transition-colors">
                Contacto
              </a>
            </nav>

            {/* CTA Button */}
            <Link href="/auth">
              <Button className="bg-[#4F7942] hover:bg-[#3e6036] text-white">Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="py-20 bg-gradient-to-br from-[#F5F6FA] to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo Principal */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-7xl font-bold mb-4 font-sans">
                <span className="text-gray-700 font-mono">Sis</span>
                <span className="text-[#4F7942] font-mono">ge</span>
                <span className="text-gray-700 font-mono">Agro</span>
              </h1>
              <div className="w-24 h-1 bg-[#4F7942] mx-auto rounded-full"></div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Sistema de Gestión Económica Agropecuaria
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Controla y optimiza las finanzas de tu empresa agropecuaria con herramientas profesionales de análisis,
              seguimiento de ingresos y egresos, y reportes detallados para la toma de decisiones estratégicas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth">
                <Button size="lg" className="bg-[#4F7942] hover:bg-[#3e6036] text-white px-8 py-3 text-lg">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-[#4F7942] text-[#4F7942] hover:bg-[#4F7942] hover:text-white px-8 py-3 text-lg bg-transparent"
              >
                Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4F7942] mb-2">100%</div>
                <div className="text-gray-600">Control Financiero</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4F7942] mb-2">24/7</div>
                <div className="text-gray-600">Acceso a Datos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#4F7942] mb-2">∞</div>
                <div className="text-gray-600">Escalabilidad</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#4F7942]/10 text-[#4F7942] mb-4">Características Principales</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Todo lo que necesitas para gestionar tu agronegocio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Herramientas profesionales diseñadas específicamente para el sector agropecuario
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#4F7942]/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-[#4F7942]" />
                </div>
                <CardTitle className="text-xl">Dashboard Inteligente</CardTitle>
                <CardDescription>
                  Visualiza todos tus datos financieros en tiempo real con gráficos interactivos y métricas clave.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#4F7942]/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-[#4F7942]" />
                </div>
                <CardTitle className="text-xl">Análisis de Tendencias</CardTitle>
                <CardDescription>
                  Identifica patrones y tendencias en tus ingresos y gastos para optimizar la rentabilidad.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#4F7942]/10 rounded-lg flex items-center justify-center mb-4">
                  <PieChart className="h-6 w-6 text-[#4F7942]" />
                </div>
                <CardTitle className="text-xl">Reportes Detallados</CardTitle>
                <CardDescription>
                  Genera reportes personalizados por categorías, períodos y tipos de movimientos financieros.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#4F7942]/10 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-[#4F7942]" />
                </div>
                <CardTitle className="text-xl">Gestión de Impuestos</CardTitle>
                <CardDescription>
                  Calcula automáticamente impuestos y percepciones para mantener tu contabilidad al día.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#4F7942]/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#4F7942]" />
                </div>
                <CardTitle className="text-xl">Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Control de acceso con diferentes niveles de permisos para tu equipo de trabajo.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#4F7942]/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#4F7942]" />
                </div>
                <CardTitle className="text-xl">Seguridad Avanzada</CardTitle>
                <CardDescription>
                  Tus datos están protegidos con encriptación de nivel empresarial y respaldos automáticos.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-[#F5F6FA]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-[#4F7942]/10 text-[#4F7942] mb-4">Beneficios</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Transforma la gestión financiera de tu empresa agropecuaria
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                SisGeAgro te ayuda a tomar decisiones informadas basadas en datos reales, optimizando la rentabilidad y
                eficiencia de tu operación.
              </p>

              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#4F7942] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Ahorro de Tiempo</h3>
                    <p className="text-gray-600">
                      Automatiza procesos contables y reduce el tiempo de gestión administrativa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#4F7942] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Mayor Rentabilidad</h3>
                    <p className="text-gray-600">
                      Identifica oportunidades de mejora y optimiza tus recursos financieros.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#4F7942] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Control Total</h3>
                    <p className="text-gray-600">
                      Mantén un control completo sobre todos los aspectos financieros de tu empresa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#4F7942] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Decisiones Informadas</h3>
                    <p className="text-gray-600">
                      Accede a información precisa y actualizada para tomar mejores decisiones.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="shadow-lg border-none text-center p-6">
                <DollarSign className="h-12 w-12 text-[#4F7942] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Ingresos</h3>
                <p className="text-gray-600">Seguimiento detallado de todos tus ingresos por categoría y período</p>
              </Card>

              <Card className="shadow-lg border-none text-center p-6">
                <TrendingUp className="h-12 w-12 text-[#4F7942] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Egresos</h3>
                <p className="text-gray-600">Control completo de gastos operativos y de inversión</p>
              </Card>

              <Card className="shadow-lg border-none text-center p-6">
                <Calendar className="h-12 w-12 text-[#4F7942] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Períodos</h3>
                <p className="text-gray-600">Análisis comparativo entre diferentes períodos de tiempo</p>
              </Card>

              <Card className="shadow-lg border-none text-center p-6">
                <Target className="h-12 w-12 text-[#4F7942] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Objetivos</h3>
                <p className="text-gray-600">Establece y monitorea el cumplimiento de metas financieras</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#4F7942]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para optimizar la gestión de tu empresa agropecuaria?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Únete a los productores que ya están transformando su gestión financiera con SisGeAgro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-[#4F7942] hover:bg-gray-100 px-8 py-3 text-lg">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#4F7942] px-8 py-3 text-lg bg-transparent"
            >
              Solicitar Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 font-sans">
                <span className="text-gray-300 font-mono">Sis</span>
                <span className="text-[#4F7942] font-mono">ge</span>
                <span className="text-gray-300 font-mono">Agro</span>
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Sistema de Gestión Económica Agropecuaria diseñado para optimizar la rentabilidad y eficiencia de tu
                empresa.
              </p>
              <p className="text-gray-400">© 2024 SisGeAgro. Todos los derechos reservados.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#caracteristicas" className="hover:text-white transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#beneficios" className="hover:text-white transition-colors">
                    Beneficios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentación
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Estado del Sistema
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>Desarrollado con ❤️ para el sector agropecuario</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
