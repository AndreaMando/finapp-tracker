"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "it";
const STORAGE_KEY = "vaulty_language";
const DEFAULT_LANG: Lang = "en";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // english keys map to themselves for convenience
  },
  it: {
    // ─── Auth (Login / Register) ────────────────────────────────────────────────
    "Sign in": "Accedi",
    "Sign in form": "Modulo di accesso",
    "Logout": "Esci",
    "Welcome": "Benvenuto",
    "Welcome back": "Bentornato",
    "Invalid credentials. Please try again.": "Credenziali non valide. Riprova.",
    "Sign in to your account to continue": "Accedi al tuo account per continuare",
    "Show password": "Mostra password",
    "Hide password": "Nascondi password",
    "Signing in...": "Accesso in corso...",
    "username@email.com": "utente@email.com",
    "Because our goal is to make your goals easier.": "Perché il nostro obiettivo è rendere i tuoi obiettivi più facili.",
    "Create your Account": "Crea il tuo Account",
    "Sign up": "Registrati",
    "Already have an account?": "Hai già un account?",
    "Don't have an account?": "Non hai un account?",
    "All fields are required.": "Tutti i campi sono obbligatori.",
    "A user with this email already exists.": "Un utente con questa email esiste già.",
    "Registration successful! Redirecting to login...": "Registrazione completata! Verrai reindirizzato al login...",
    "Please enter a valid email address": "Inserisci un indirizzo email valido",
    "Registration form": "Modulo di registrazione",
    "Join Vaulty and take control of your finances." : "Unisciti a Vaulty e gestisci le tue finanze.",
    "Creating account..."  : "Creazione account...",
    "Too short" : "Troppo corta",
    "Fair" : "Discreta",
    "Strong" : "Sicura",
    "Confirm Password" : "Conferma Password",
    "Passwords do not match" : "Le password non corrispondono",
    "Password Requirements" : "Requisiti password",
    "Password is too short" : "La password è troppo corta",
    "Password is too common" : "La password è troppo comune",
    "Password is too simple" : "La password è troppo semplice",
    "Password is too long" : "La password è troppo lunga",

    // ─── General UI ─────────────────────────────────────────────────────────────
    "Dashboard": "Panoramica",
    "Income": "Entrate",
    "Expenses": "Spese",
    "Recurring": "Ricorrenti",
    "Goals": "Obiettivi",
    "Savings": "Risparmi",
    "Personal Finance": "Finanza Personale",
    "Language": "Lingua",
    "Select language": "Seleziona lingua",
    "footerText": "Dati memorizzati localmente nel browser",
    "Cancel": "Annulla",
    "Update": "Aggiorna",
    "Save": "Salva",
    "Edit": "Modifica",
    "Delete": "Elimina",
    "Add": "Aggiungi",
    "View all": "Vedi tutti",
    "Enable": "Abilita",
    "Disable": "Disabilita",
    "Month navigation": "Navigazione mese",
    "Previous month": "Mese precedente",
    "Next month": "Mese successivo",
    "This Month": "Questo Mese",
    "Total:": "Totale:",
    "Total for": "Totale per",
    "Date": "Data",
    "Category": "Categoria",
    "Description": "Descrizione",
    "Amount": "Importo",
    "Name": "Nome",
    "Note (optional)": "Nota (opzionale)",
    "Month": "Mese",
    "View mode": "Modalità visualizzazione",
    "Quick Actions": "Azioni Rapide",
    "Quick actions": "Azioni rapide",
    "History": "Storico",
    "Confirm Deletion": "Conferma Eliminazione",

    // ─── Dashboard ──────────────────────────────────────────────────────────────
    "Your monthly financial overview": "Panoramica finanziaria mensile",
    "Total Expenses": "Spese Totali",
    "Goal Contributions": "Contributi agli Obiettivi",
    "Net Savings": "Risparmi Netti",
    "Great job! 🎉": "Ottimo lavoro! 🎉",
    "Over budget": "Oltre il budget",
    "Expense Breakdown": "Suddivisione delle Spese",
    "No data for this month yet.": "Nessun dato per questo mese.",
    
    // ─── Income ─────────────────────────────────────────────────────────────────
    "Add Income": "Aggiungi Entrata",
    "Add income": "Aggiungi entrata",
    "Set income for this month": "Imposta entrate per questo mese",
    "Set Income": "Imposta Entrata",
    "Record your earnings": "Registra i tuoi guadagni",
    "Record your monthly earnings": "Registra i tuoi guadagni mensili",
    "Update Income": "Aggiorna Entrata",
    "Save Income": "Salva Entrata",
    "Income for": "Entrate per",
    "Income History": "Storico Entrate",
    "Edit income for this month": "Modifica entrate per questo mese",
    "No income recorded for this month.": "Nessuna entrata registrata per questo mese.",
    "No income entries yet.": "Nessuna entrata ancora.",
    "Delete this income entry?": "Eliminare questa entrata?",
    "Delete income for this month": "Eliminare le entrate per questo mese",
    "Delete income for": "Eliminare entrate per",
    "This income entry will be permanently deleted.": "Questa entrata verrà eliminata definitivamente.",
    "Edit Income": "Modifica Entrata",
    "e.g. 2500.00": "es. 2500.00",
    "e.g. Salary + bonus": "es. Stipendio + bonus",

    // ─── Expenses (One-Time) ────────────────────────────────────────────────────
    "One-time Expenses": "Spese Una Tantum",
    "One-time and variable spending": "Spese una tantum e variabili",
    "One-time and variable expenses": "Spese una tantum e variabili",
    "Add Expense": "Aggiungi Spesa",
    "Add an expense": "Aggiungi una spesa",
    "Add First Expense": "Aggiungi Prima Spesa",
    "Edit Expense": "Modifica Spesa",
    "expenses": "spese",
    "Dinners, shopping, etc.": "Cene, acquisti, ecc.",
    "No expenses for this month": "Nessuna spesa per questo mese",
    "Track your spending by adding expenses": "Tieni traccia delle tue spese aggiungendo spese",
    "Delete this expense?": "Eliminare questa spesa?",
    "This expense will be permanently deleted. This action cannot be undone.": "Questa spesa verrà eliminata definitivamente. Questa azione non può essere annullata.",
    "e.g. Dinner at restaurant": "es. Cena al ristorante",
    "e.g. 12.99": "es. 12.99",

    // ─── Recurring Expenses ─────────────────────────────────────────────────────
    "Recurring Expenses": "Spese Ricorrenti",
    "recurringExpenses": "Spese Ricorrenti",
    "Manage recurring expenses": "Gestisci le spese ricorrenti",
    "Bills, subscriptions, insurance": "Bollette, abbonamenti, assicurazioni",
    "Add Recurring Expense": "Aggiungi Spesa Ricorrente",
    "Edit Recurring Expense": "Modifica Spesa Ricorrente",
    "Bills, subscriptions, and fixed costs": "Bollette, abbonamenti e costi fissi",
    "Add your bills, subscriptions, and fixed costs": "Aggiungi le tue bollette, abbonamenti e costi fissi",
    "Total monthly recurring": "Totale ricorrente mensile",
    "No recurring expenses yet": "Nessuna spesa ricorrente ancora",
    "Delete this recurring expense?": "Eliminare questa spesa ricorrente?",
    "This recurring expense will be permanently deleted. This action cannot be undone.": "Questa spesa ricorrente verrà eliminata definitivamente. Questa azione non può essere annullata.",
    "Monthly Amount": "Importo Mensile",
    "Monthly Amount (€)": "Importo Mensile (€)",
    "Start Month": "Mese di inizio",
    "Starts:": "Inizia:",
    "Started:": "Iniziato:",
    "Active": "Attive",
    "Paused": "In pausa",
    "Upcoming": "In arrivo",
    "active expense": "spesa attiva",
    "active expenses": "spese attive",
    "expense": "spesa",
    "Number of entries": "Numero di voci",
    "/mo": "/mese",
    "e.g. Netflix, Rent, Car Insurance": "es. Netflix, Affitto, Assicurazione auto",
    "Caricamento spese ricorrenti...": "Loading recurring expenses...",

    // ─── Goals ──────────────────────────────────────────────────────────────────
    "Savings Goals": "Obiettivi di Risparmio",
    "savingsGoals": "Obiettivi di Risparmio",
    "Contribute to a goal": "Contribuisci a un obiettivo",
    "Track your savings targets": "Monitora i tuoi obiettivi di risparmio",
    "Track your financial targets": "Monitora i tuoi obiettivi finanziari",
    "Total Goals": "Obiettivi Totali",
    "Total Saved": "Totale Salvato",
    "Total Target": "Obiettivo Totale",
    "Active Goals": "Obiettivi Attivi",
    "Completed Goals": "Obiettivi Completati",
    "Create Savings Goal": "Crea Obiettivo di Risparmio",
    "Create First Goal": "Crea Primo Obiettivo",
    "New Goal": "Nuovo Obiettivo",
    "Create Goal": "Crea Obiettivo",
    "Goal Name": "Nome Obiettivo",
    "Target Amount": "Importo Target",
    "Deadline": "Scadenza",
    "Add Money": "Aggiungi Denaro",
    "Add Money to": "Aggiungi Denaro a",
    "Amount to Add": "Importo da Aggiungere",
    "Add Contribution": "Aggiungi Contributo",
    "Delete goal": "Elimina obiettivo",
    "No savings goals yet": "Nessun obiettivo di risparmio ancora",
    "Create a goal to start tracking your savings progress": "Crea un obiettivo per iniziare a monitorare i tuoi progressi di risparmio",
    "Delete this goal and all its contributions?": "Eliminare questo obiettivo e tutti i suoi contributi?",
    "No contributions yet.": "Nessun contributo ancora.",
    "Remove this contribution?": "Rimuovere questo contributo?",
    "Remove contribution": "Rimuovi contributo",
    "This contribution will be permanently removed from this goal.": "Questo contributo verrà rimosso definitivamente da questo obiettivo.",
    "This goal and all its contributions will be permanently deleted.": "Questo obiettivo e tutti i suoi contributi verranno eliminati definitivamente.",
    "completed": "completati",
    "Completed": "Completati",
    "complete": "completato",
    "remaining": "rimanenti",
    "of": "di",
    "Color": "Colore",
    "Choose goal color": "Scegli il colore dell'obiettivo",
    "across all goals": "su tutti gli obiettivi",
    "overall": "complessivo",
    "saved": "salvato",
    "to go": "rimanenti",
    "Days left": "Giorni rimanenti",
    "d left": "g rimanenti",
    "Overdue": "Scaduto",
    "Needed/month": "Necessario/mese",
    "Saved:": "Salvato:",
    "Max": "Max",
    "e.g. Emergency Fund, Vacation, New Laptop": "es. Fondo emergenze, Vacanza, Nuovo laptop",
    "e.g. Monthly savings transfer": "es. Trasferimento risparmio mensile",

    // ─── Categories ─────────────────────────────────────────────────────────────
    "Food & Dining": "Cibo e Ristorazione",
    "Shopping": "Acquisti",
    "Entertainment": "Intrattenimento",
    "Travel": "Viaggi",
    "Health": "Salute",
    "Personal Care": "Cura Personale",
    "Gifts": "Regali",
    "Home": "Casa",
    "Other": "Altro",
    "Housing": "Alloggio",
    "Utilities": "Utenze",
    "Insurance": "Assicurazione",
    "Subscriptions": "Abbonamenti",
    "Transport": "Trasporto",
    "Financing": "Finanziamento",
    "Mortage": "Mutuo",
    "Add Category": "Aggiungi Categoria",

    // ─── Errors & Validation ────────────────────────────────────────────────────
    "Not authenticated": "Non autenticato",
    "Could not connect to the server. Please try again later.": "Impossibile connettersi al server. Riprova più tardi.",
    "An internal error occurred.": "Si è verificato un errore interno.",
    "An error occurred. Please try again.": "Si è verificato un errore. Riprova.",
    "Name is required" : "Il nome è obbligatorio",
    "Password is required" : "La password è obbligatoria",
    "Confirm Password is required" : "La conferma password è obbligatoria",
    "Email is required" : "L'email è obbligatoria",
    "Email is invalid" : "L'email non è valida",
    "Name is required.": "Il nome è obbligatorio.",
    "Enter a valid amount.": "Inserisci un importo valido.",
    "Date is required.": "La data è obbligatoria.",
    "Enter a valid target amount.": "Inserisci un importo target valido.",
    "Deadline is required.": "La scadenza è obbligatoria.",
    "Please enter a valid amount greater than 0.": "Inserisci un importo valido maggiore di 0.",
    "Start month is required.": "Il mese di inizio è obbligatorio.",
    "Enter a valid date.": "Inserisci una data valida.",
    "Category is required.": "La categoria è obbligatoria.",
    "Max contribution is": "Il contributo massimo è",
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY); // string | null
    if (stored === "en" || stored === "it") {
      // type narrowed to "en" | "it" which matches Lang
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
    }
  };

  const t = (key: string): string => {
    if (lang === "it") {
      return translations.it[key] ?? translations.en[key] ?? key;
    }
    return translations.en[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
