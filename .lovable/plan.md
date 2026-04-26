## Ziel

Aus den hochgeladenen Unternehmens-Regulatorien entsteht eine Onboarding- und Management-Webseite. Die Inhalte werden nicht vollständig veröffentlicht, sondern als kurze, themenbasierte Module aufbereitet. Bewerber, Partner, Mitarbeiter, Kollegen, Teamkameraden und Management erhalten getrennte Bereiche. Ein Admin verwaltet Rollen, Zuweisungen, Fortschritt und rechtlich belastbare Unterschriften.

## Geplante Nutzerbereiche

```text
Öffentlich / Landing
  -> Kurzvorstellung Vision, Unternehmen, Onboarding
  -> Login / Zugang beantragen

Bewerber
  -> Kurze Struktur- und Erwartungsübersicht
  -> Bewerbungs-/Onboarding-Formulare
  -> Signaturfelder

Partner
  -> Partnerregeln, Zusammenarbeit, Compliance-Kurzmodule
  -> Partner-Formulare
  -> Signaturfelder

Mitarbeiter
  -> interne Regulatorien als Kurzmodule
  -> zugewiesene Aufgaben / Bestätigungen
  -> Signaturfelder

Kollegen / Team
  -> Teamregeln, Vision Style, Zusammenarbeit
  -> Aufgabenstatus und Team-Onboarding

Management
  -> Übersicht über Fortschritt, offene Signaturen, Rollen und Zuweisungen

Admin
  -> Nutzer, Rollen, Themen, Aufgaben, Formulare und Signaturen verwalten
```

## Inhaltliche Umsetzung

- Die hochgeladene Datei `Company_Regulatorien.tar.gz` wird nach Freigabe verarbeitet.
- Daraus werden Themen erkannt und in kurze, verständliche Module umgewandelt.
- Pro Thema entstehen nur die wichtigsten Punkte, z. B.:
  - Unternehmensstruktur
  - Vision / Style / Werte
  - Compliance / Regulatorien
  - Teamarbeit und Verhalten
  - Partner- und Bewerber-Onboarding
  - Management- und Aufgabenprozesse
- Die vollständigen Rohdaten werden nicht öffentlich angezeigt.
- Öffentliche Seiten zeigen nur kurze, neutrale Teaser; detaillierte Inhalte erscheinen erst nach Login und Rollenprüfung.

## Rechtlich verbindliche Signaturen

Für Signaturen wird ein sauberer Bestätigungsprozess integriert:

- Name der unterschreibenden Person
- Rolle / Bereich
- Thema oder Formular, das unterschrieben wurde
- digitale Unterschrift als Zeichnung oder Eingabefeld
- Bestätigungstext vor Abgabe
- Zeitstempel
- Version des unterschriebenen Inhalts
- IP-/Audit-Hinweis, soweit technisch sinnvoll
- unveränderbarer Signatur-Datensatz in der Datenbank

Hinweis: Die Website kann den Prozess technisch sauber dokumentieren und speichern. Falls die Signatur juristisch vollständig qualifiziert sein muss, müsste später zusätzlich ein zertifizierter eIDAS-/Signaturdienst eingebunden werden.

## Daten und Rollen

Es wird Lovable Cloud / Supabase genutzt mit sicherer Speicherung und Row-Level-Security.

Geplante Datenbereiche:

- Nutzerprofile: Name, Rolle, Unternehmen/Team, Status
- Rollen separat in einer `user_roles`-Tabelle, nicht direkt im Profil
- Themenmodule: Titel, Kurzbeschreibung, Zielrolle, Version, Status
- Aufgaben/Zuweisungen: Nutzer, Modul, Frist, Status
- Formulare: Bewerber-, Partner-, Mitarbeiter- und Onboarding-Daten
- Signaturen: Nutzer, Thema/Formular, Signaturdaten, Zeitstempel, Version, Auditdaten

Admin-Rechte werden serverseitig geprüft, nicht über lokalen Browser-Speicher.

## Seiten und UX

- Moderne Onboarding-Landingpage mit klarer Vision-Optik
- Rollenbasierte Login-Weiterleitung
- Separates Dashboard je Rolle
- Management-Dashboard mit Fortschrittsübersicht
- Admin-Dashboard für Verwaltung
- Responsive Design für Desktop, Tablet und Mobile
- Klare Statusanzeigen: Offen, In Bearbeitung, Unterschrieben, Überfällig
- Formular- und Signaturfluss mit eindeutiger Bestätigung vor dem Speichern

## Technischer Ablauf nach Freigabe

1. Projekt-Platzhalter entfernen und echte Website-Struktur aufbauen.
2. Datei `Company_Regulatorien.tar.gz` entpacken und Inhalte analysieren.
3. Kurze themenbasierte Inhalte aus den Regulatorien ableiten.
4. Datenbanktabellen, Rollen, Sicherheitsregeln und Signaturspeicherung anlegen.
5. Login-System mit getrennten Rollenbereichen erstellen.
6. Admin-/Management-Oberflächen für Zuweisungen, Fortschritt und Signaturen bauen.
7. Bewerber-, Partner- und Mitarbeiterformulare integrieren.
8. Signaturfelder inklusive Speicherung, Versionierung und Auditdaten umsetzen.
9. Seiten-Metadaten und separate Routen für die wichtigsten Bereiche ergänzen.
10. Build prüfen und Basis-Qualität testen.

## Wichtige Sicherheitsregeln

- Rollen werden in einer separaten Rollentabelle gespeichert.
- Admin-Zugriff wird serverseitig validiert.
- Signaturen und Formulare werden nicht öffentlich zugänglich gemacht.
- Nutzer sehen nur Inhalte, die zu ihrer Rolle passen.
- Öffentliche Seiten enthalten nur kurze, themenbasierte Inhalte und keine sensiblen Details aus den Regulatorien.