"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "it";
const STORAGE_KEY = "fintrack_language";
const DEFAULT_LANG: Lang = "en";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // english keys map to themselves for convenience
  },
  it: {
    // Dashboard page
    "Dashboard": "Cruscotto",
    "Your monthly financial overview": "Panoramica finanziaria mensile",
    Income: "Entrate",
    "Total Expenses": "Spese Totali",
    Recurring: "Ricorrenti",
    "Goal Contributions": "Contributi agli Obiettivi",
    "Net Savings": "Risparmi Netti",
    "Great job! 🎉": "Ottimo lavoro! 🎉",
    "Over budget": "Oltre il budget",
    "Expense Breakdown": "Suddivisione delle Spese",
    "No data for this month yet.": "Nessun dato per questo mese.",
    "Add income": "Aggiungi entrata",
    "Expenses": "Spese",
    "One-time and variable spending": "Spese una tantum e variabili",
    "Quick Actions": "Azioni Rapide",
    "Set income for this month": "Imposta entrate per questo mese",
    "Record your earnings": "Registra i tuoi guadagni",
    "Manage recurring expenses": "Gestisci le spese ricorrenti",
    "Bills, subscriptions, insurance": "Bollette, abbonamenti, assicurazioni",
    "Add an expense": "Aggiungi una spesa",
    "Dinners, shopping, etc.": "Cene, acquisti, ecc.",
    "Contribute to a goal": "Contribuisci a un obiettivo",
    "Track your savings targets": "Monitora i tuoi obiettivi di risparmio",
    "View all": "Vedi tutti",
    "This Month": "Questo Mese",

    // buttons/general
    "Add Expense": "Aggiungi Spesa",
    Cancel: "Annulla",
    "Add Goal": "Aggiungi Obiettivo",
    "Add Income": "Aggiungi Entrata",
    "Add Recurring Expense": "Aggiungi Spesa Ricorrente",
    "Add Category": "Aggiungi Categoria",
    "Add First Expense": "Aggiungi Prima Spesa",
    "Add Contribution": "Aggiungi Contributo",
    "Create First Goal": "Crea Primo Obiettivo",

    // forms
    Description: "Descrizione",
    "e.g. Dinner at restaurant": "es. Cena al ristorante",
    "e.g. Emergency Fund, Vacation, New Laptop": "es. Fondo emergenze, Vacanza, Nuovo laptop",
    Amount: "Importo",
    Date: "Data",
    Category: "Categoria",
    "Name is required.": "Il nome è obbligatorio.",
    "Enter a valid amount.": "Inserisci un importo valido.",
    "Date is required.": "La data è obbligatoria.",
    "Enter a valid target amount.": "Inserisci un importo target valido.",
    "Deadline is required.": "La scadenza è obbligatoria.",
    "Please enter a valid amount greater than 0.": "Inserisci un importo valido maggiore di 0.",
    "Delete this income entry?": "Eliminare questa voce di entrata?",
    "Monthly Amount": "Importo Mensile",
    "e.g. Netflix, Rent, Car Insurance": "es. Netflix, Affitto, Assicurazione auto",
    "Recurring Expenses": "Spese Ricorrenti",
    "Bills, subscriptions, and fixed costs": "Bollette, abbonamenti e costi fissi",
    "Delete this recurring expense?": "Eliminare questa spesa ricorrente?",
    "Update": "Aggiorna",
    "Delete this expense?": "Eliminare questa spesa?",
    "e.g. 2500.00": "es. 2500.00",
    "e.g. Salary + bonus": "es. Stipendio + bonus",
    "e.g. Monthly savings transfer": "es. Trasferimento risparmio mensile",
    "e.g. 12.99": "es. 12.99",
    "Edit Expense": "Modifica Spesa",

    // language selector
    "Language": "Lingua",
    "Savings Goals": "Obiettivi di Risparmio",
    "Total Goals": "Obiettivi Totali",
    "across all goals": "su tutti gli obiettivi",
    "Active Goals": "Obiettivi Attivi",
    "Goal Name": "Nome Obiettivo",
    "Target Amount": "Importo Target",

    // sidebar & general
    "dashboard": "Cruscotto",
    "income": "Entrate",
    "recurringExpenses": "Spese Ricorrenti",
    "Savings": "Risparmi",
    "expenses": "Spese",
    "savingsGoals": "Obiettivi di Risparmio",
    "footerText": "Dati memorizzati localmente nel browser",
    "Personal Finance": "Finanza Personale",
    "One-time Expenses": "Spese Una Tantum",

    // categories
    "Food & Dining": "Cibo e Ristorazione",
    "Shopping": "Acquisti",
    "Entertainment": "Intrattenimento",
    "Travel": "Viaggi",
    "Health": "Salute",
    "Personal Care": "Cura Personale",
    "Gifts": "Regali",
    "Home": "Casa",
    "Other": "Altro",

    // recurring page
    "Housing": "Alloggio",
    "Utilities": "Utenze",
    "Insurance": "Assicurazione",
    "Subscriptions": "Abbonamenti",
    "Transport": "Trasporto",
    "Education": "Istruzione",
    "expense": "spesa",
    
    // recurring page labels
    "Total monthly recurring": "Totale ricorrente mensile",
    "active expense": "spesa attiva",
    "active expenses": "spese attive",
    "Add your bills, subscriptions, and fixed costs": "Aggiungi le tue bollette, abbonamenti e costi fissi",
    "Monthly Amount (€)": "Importo Mensile (€)",
    "Name": "Nome",
    "/mo": "/mese",
    "Paused": "In pausa",
    "Active": "Attive",
    "Start Month": "Mese di inizio",
    "Start month is required.": "Il mese di inizio è obbligatorio.",
    "Upcoming": "In arrivo",
    "Starts:": "Inizia:",
    "Started:": "Iniziato:",
    
    // income page
    "Month": "Mese",
    "Note (optional)": "Nota (opzionale)",
    "Update Income": "Aggiorna Entrata",
    "Save Income": "Salva Entrata",
    "Set Income": "Imposta Entrata",
    "Income for": "Entrate per",
    "Record your monthly earnings": "Registra i tuoi guadagni mensili",
    "Income History": "Storico Entrate",
    "No income recorded for this month.": "Nessuna entrata registrata per questo mese.",
    "No income entries yet.": "Nessuna voce di entrata ancora.",
    "Edit": "Modifica",
    "Delete": "Elimina",
    "Edit Income": "Modifica Entrata",

    // goals page translations
    "Color": "Colore",
    "Create Goal": "Crea Obiettivo",
    "Max contribution is": "Contributo massimo è",
    "Remove this contribution?": "Rimuovere questo contributo?",
    "of": "di",
    "complete": "completato",
    "remaining": "rimanenti",
    "Days left": "Giorni rimanenti",
    "Needed/month": "Necessario/mese",
    "Add Money": "Aggiungi Denaro",
    "History": "Storico",
    "Track your financial targets": "Monitora i tuoi obiettivi finanziari",
    "New Goal": "Nuovo Obiettivo",
    "Total Saved": "Totale Salvato",
    "Total Target": "Obiettivo Totale",
    "overall": "complessivo",
    "completed": "completati",
    "Completed": "Completati",
    "Completed Goals": "Obiettivi Completati",
    "No contributions yet.": "Nessun contributo ancora.",
    "No recurring expenses yet": "Nessuna spesa ricorrente ancora",
    "d left": "g rimanenti",
    "saved": "salvato",
    "to go": "rimanenti",
    "Edit Recurring Expense": "Modifica Spesa Ricorrente",
    "Saved:": "Salvato:",
    "Remaining:": "Rimanenti:",
    "Total for": "Totale per",
    "No expenses for this month": "Nessuna spesa per questo mese",
    "Track your spending by adding expenses": "Tieni traccia delle tue spese aggiungendo spese",
    "Create Savings Goal": "Crea Obiettivo di Risparmio",
    "No savings goals yet": "Nessun obiettivo di risparmio ancora",
    "Create a goal to start tracking your savings progress": "Crea un obiettivo per iniziare a monitorare i tuoi progressi di risparmio",
    "Deadline": "Scadenza",
    "Add Money to": "Aggiungi Denaro a",
    "Amount to Add": "Importo da Aggiungere",
    

    // months will remain in English since they are generated by toLocaleDateString with en-US; maybe improve later
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
