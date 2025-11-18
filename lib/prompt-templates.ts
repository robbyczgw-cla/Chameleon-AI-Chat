import type { PromptTemplate } from "@/types"

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  // HiFi Store - Produktberatung
  {
    id: "hifi-produktberatung",
    name: "HiFi Produktberatung",
    description: "Kundenberatung für HiFi-Produkte",
    category: "HiFi Geschäft",
    content:
      "Ich berate einen Kunden, der nach {{produkttyp}} sucht. Budget: {{budget}} Euro.\n\nBitte erstelle eine professionelle Produktempfehlung mit:\n1. 3-5 passenden Produkten in der Preisklasse\n2. Vor- und Nachteile jedes Produkts\n3. Technische Highlights\n4. Persönliche Empfehlung mit Begründung\n\nZusätzliche Anforderungen: {{anforderungen}}",
    variables: ["produkttyp", "budget", "anforderungen"],
    createdAt: Date.now(),
  },
  {
    id: "hifi-raumakustik",
    name: "Raumakustik Beratung",
    description: "Beratung zur optimalen Raumakustik",
    category: "HiFi Geschäft",
    content:
      "Kunde hat einen Raum mit folgenden Maßen: {{raumgroesse}}\nRaumtyp: {{raumtyp}}\nGeplante Nutzung: {{nutzung}}\n\nBitte erstelle eine detaillierte Empfehlung für:\n1. Optimale Lautsprecherpositionierung\n2. Akustische Behandlung des Raums\n3. Empfohlene Produkte (Absorber, Diffusoren, etc.)\n4. Setup-Tipps für beste Klangqualität",
    variables: ["raumgroesse", "raumtyp", "nutzung"],
    createdAt: Date.now(),
  },
  {
    id: "hifi-systemzusammenstellung",
    name: "HiFi System Zusammenstellung",
    description: "Komplettes HiFi-System planen",
    category: "HiFi Geschäft",
    content:
      "Kunde möchte ein komplettes HiFi-System zusammenstellen.\n\nBudget: {{budget}} Euro\nMusikgenres: {{genres}}\nRaumgröße: {{raumgroesse}}\nBesondere Wünsche: {{wuensche}}\n\nBitte erstelle einen detaillierten Systemvorschlag mit:\n1. Lautsprecher (mit Begründung)\n2. Verstärker/Receiver\n3. Quellgeräte (CD-Player, Streamer, Plattenspieler)\n4. Kabel und Zubehör\n5. Gesamtpreis und Alternativen",
    variables: ["budget", "genres", "raumgroesse", "wuensche"],
    createdAt: Date.now(),
  },
  {
    id: "hifi-upgrade-beratung",
    name: "Upgrade Beratung",
    description: "Bestehendes System verbessern",
    category: "HiFi Geschäft",
    content:
      "Kunde hat bereits folgendes System:\n{{bestehendes_system}}\n\nBudget für Upgrade: {{budget}} Euro\nZiel der Verbesserung: {{ziel}}\n\nBitte analysiere das bestehende System und empfehle:\n1. Welche Komponente sollte zuerst verbessert werden?\n2. Konkrete Produktempfehlungen\n3. Erwartete Klangverbesserung\n4. Langfristige Upgrade-Strategie",
    variables: ["bestehendes_system", "budget", "ziel"],
    createdAt: Date.now(),
  },
  {
    id: "hifi-vinyl-setup",
    name: "Vinyl Setup Beratung",
    description: "Plattenspieler und Vinyl-Setup",
    category: "HiFi Geschäft",
    content:
      "Kunde interessiert sich für Vinyl.\n\nErfahrung: {{erfahrung}}\nBudget: {{budget}} Euro\nMusiksammlung: {{sammlung}}\n\nBitte empfehle:\n1. Passenden Plattenspieler\n2. Phono-Vorverstärker (falls nötig)\n3. Tonabnehmer-Optionen\n4. Pflege und Wartung\n5. Zubehör (Reinigung, Aufbewahrung)\n6. Tipps für Einsteiger/Fortgeschrittene",
    variables: ["erfahrung", "budget", "sammlung"],
    createdAt: Date.now(),
  },
  {
    id: "hifi-streaming-setup",
    name: "Streaming Setup",
    description: "Digitales Streaming-System einrichten",
    category: "HiFi Geschäft",
    content:
      "Kunde möchte ein Streaming-System einrichten.\n\nBudget: {{budget}} Euro\nStreaming-Dienste: {{dienste}}\nMultiroom gewünscht: {{multiroom}}\nVorhandene Geräte: {{geraete}}\n\nBitte empfehle:\n1. Streaming-Lösung (Streamer, DAC)\n2. Netzwerk-Setup\n3. App-Steuerung\n4. Integration mit bestehendem System\n5. Multiroom-Optionen (falls gewünscht)",
    variables: ["budget", "dienste", "multiroom", "geraete"],
    createdAt: Date.now(),
  },
  {
    id: "hifi-heimkino",
    name: "Heimkino Beratung",
    description: "Heimkino-System planen",
    category: "HiFi Geschäft",
    content:
      "Kunde plant ein Heimkino.\n\nRaumgröße: {{raumgroesse}}\nBudget: {{budget}} Euro\nNutzung: {{nutzung}}\nGewünschtes Format: {{format}}\n\nBitte erstelle einen Heimkino-Plan mit:\n1. Lautsprecher-Konfiguration (5.1, 7.1, Atmos)\n2. AV-Receiver Empfehlung\n3. Subwoofer-Auswahl\n4. Positionierung und Kalibrierung\n5. Kabel und Installation",
    variables: ["raumgroesse", "budget", "nutzung", "format"],
    createdAt: Date.now(),
  },
  {
    id: "hifi-kopfhoerer",
    name: "Kopfhörer Beratung",
    description: "Kopfhörer-Empfehlung",
    category: "HiFi Geschäft",
    content:
      "Kunde sucht Kopfhörer.\n\nNutzung: {{nutzung}}\nBudget: {{budget}} Euro\nMusikgenres: {{genres}}\nBauform: {{bauform}}\n\nBitte empfehle:\n1. 3-5 passende Kopfhörer-Modelle\n2. Vor- und Nachteile\n3. Klangcharakteristik\n4. Kopfhörerverstärker (falls sinnvoll)\n5. Zubehör (Kabel, Pads, etc.)",
    variables: ["nutzung", "budget", "genres", "bauform"],
    createdAt: Date.now(),
  },
  // Allgemeine Business-Prompts
  {
    id: "produktbeschreibung",
    name: "Produktbeschreibung erstellen",
    description: "Verkaufsfördernde Produkttexte",
    category: "Marketing",
    content:
      "Erstelle eine ansprechende Produktbeschreibung für:\n\nProdukt: {{produkt}}\nMarke: {{marke}}\nPreis: {{preis}} Euro\nZielgruppe: {{zielgruppe}}\n\nDie Beschreibung soll:\n1. Technische Highlights hervorheben\n2. Emotionale Kaufanreize schaffen\n3. Alleinstellungsmerkmale betonen\n4. SEO-optimiert sein\n5. Österreichisches Deutsch verwenden",
    variables: ["produkt", "marke", "preis", "zielgruppe"],
    createdAt: Date.now(),
  },
  {
    id: "kundenanfrage",
    name: "Kundenanfrage beantworten",
    description: "Professionelle Kundenantwort",
    category: "Kundenservice",
    content:
      "Kundenanfrage:\n{{anfrage}}\n\nBitte formuliere eine professionelle, freundliche Antwort auf Deutsch (Österreich), die:\n1. Alle Fragen beantwortet\n2. Zusätzliche hilfreiche Informationen bietet\n3. Zum Besuch im Geschäft oder Online-Shop einlädt\n4. Kontaktmöglichkeiten nennt",
    variables: ["anfrage"],
    createdAt: Date.now(),
  },
  {
    id: "newsletter",
    name: "Newsletter erstellen",
    description: "Newsletter-Content generieren",
    category: "Marketing",
    content:
      "Erstelle einen Newsletter für unser HiFi-Geschäft.\n\nThema: {{thema}}\nAngebote: {{angebote}}\nZielgruppe: {{zielgruppe}}\n\nDer Newsletter soll:\n1. Aufmerksamkeit erregen\n2. Produkte/Angebote vorstellen\n3. Call-to-Action enthalten\n4. Persönlich und authentisch wirken\n5. Österreichisches Deutsch verwenden",
    variables: ["thema", "angebote", "zielgruppe"],
    createdAt: Date.now(),
  },
  {
    id: "social-media",
    name: "Social Media Post",
    description: "Social Media Content erstellen",
    category: "Marketing",
    content:
      "Erstelle einen Social Media Post für:\n\nPlattform: {{plattform}}\nThema: {{thema}}\nProdukt/Aktion: {{inhalt}}\n\nDer Post soll:\n1. Aufmerksamkeit erregen\n2. Engagement fördern\n3. Passende Hashtags enthalten\n4. Call-to-Action haben\n5. Zur Marke passen",
    variables: ["plattform", "thema", "inhalt"],
    createdAt: Date.now(),
  },
]

export class PromptTemplateService {
  private templates: PromptTemplate[]

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("promptTemplates")
      this.templates = saved ? JSON.parse(saved) : DEFAULT_TEMPLATES
    } else {
      this.templates = DEFAULT_TEMPLATES
    }
  }

  getAll(): PromptTemplate[] {
    return this.templates
  }

  getByCategory(category: string): PromptTemplate[] {
    return this.templates.filter((t) => t.category === category)
  }

  getCategories(): string[] {
    return Array.from(new Set(this.templates.map((t) => t.category)))
  }

  get(id: string): PromptTemplate | undefined {
    return this.templates.find((t) => t.id === id)
  }

  create(template: Omit<PromptTemplate, "id" | "createdAt">): PromptTemplate {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
    }
    this.templates.push(newTemplate)
    this.save()
    return newTemplate
  }

  update(id: string, updates: Partial<PromptTemplate>): void {
    const index = this.templates.findIndex((t) => t.id === id)
    if (index !== -1) {
      this.templates[index] = { ...this.templates[index], ...updates }
      this.save()
    }
  }

  delete(id: string): void {
    this.templates = this.templates.filter((t) => t.id !== id)
    this.save()
  }

  fillTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.get(templateId)
    if (!template) throw new Error("Template not found")

    let content = template.content
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value)
    }
    return content
  }

  private save(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("promptTemplates", JSON.stringify(this.templates))
    }
  }
}

export const promptTemplateService = new PromptTemplateService()
