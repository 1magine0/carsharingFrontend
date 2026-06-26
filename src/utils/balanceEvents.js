/* Lightweight cross-component signal that the user's bonus balance changed.
   The Navbar fetches the balance once on mount and otherwise stays mounted across
   navigation, so without this it shows a stale value until a full page reload.
   Any action that moves the balance (booking spends bonus, finishing a rental
   earns +1% via the DB trigger) dispatches this; the Navbar re-fetches on it. */
export const BALANCE_CHANGED = "balance:changed";

export const notifyBalanceChanged = () => {
    window.dispatchEvent(new Event(BALANCE_CHANGED));
};
