"use client";

import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DiceFormulaHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Dice formula help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>🎲 Dice Formula Help</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">Basic Usage</h3>
              <p className="text-muted-foreground">Enter dice notation formulas to roll dice.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Dice Notation Examples</h3>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>
                  <strong>Basic rolls:</strong> <code>2d6</code>, <code>1d20</code>,{" "}
                  <code>3d4+5</code>
                </li>
                <li>
                  <strong>With modifiers:</strong> <code>1d20+5</code>, <code>2d8-3</code>,{" "}
                  <code>1d6+2d4+7</code>
                </li>
                <li>
                  <strong>Exploding criticals:</strong> <code>1d20!</code> (rerolls on max value)
                </li>
                <li>
                  <strong>All dice explode:</strong> <code>3d6!!</code> (ALL max rolls explode, not
                  just first)
                </li>
                <li>
                  <strong>Vicious dice:</strong> <code>1d8v</code> (adds extra die on critical)
                </li>
                <li>
                  <strong>Combined:</strong> <code>1d20!v</code> or <code>2d6!!v</code> (exploding +
                  vicious)
                </li>
                <li>
                  <strong>Double-digit dice:</strong> <code>d44</code>, <code>d66</code>,{" "}
                  <code>d88</code>
                </li>
                <li>
                  <strong>Math operations:</strong> <code>(2d6+3)*2</code>, <code>1d20+5-2</code>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Advantage &amp; Disadvantage</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>
                  <strong>Advantage:</strong>
                  <ul className="list-disc list-inside ml-4">
                    <li>
                      <code>1d20a</code> or <code>1d20a1</code> (rolls 2d20, keeps highest)
                    </li>
                    <li>
                      <strong>Multiple advantage:</strong> <code>1d20a3</code> (rolls 4d20, keeps
                      highest)
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>Disadvantage:</strong>
                  <ul className="list-disc list-inside ml-4">
                    <li>
                      <code>1d20d</code> or <code>1d20d1</code> (rolls 2d20, keeps lowest)
                    </li>
                    <li>
                      <strong>Multiple disadvantage:</strong> <code>1d20d2</code> (rolls 3d20, keeps
                      lowest)
                    </li>
                  </ul>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-2 mt-2">
                  <strong className="text-yellow-800 dark:text-yellow-200">IMPORTANT:</strong>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                    When using postfix notation, the order of operations is important. Always place
                    the advantage/disadvantage postfix AFTER any exploding or vicious postfixes.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Variable Substitution</h3>
              <p className="text-muted-foreground mb-2">
                You can use character attributes and level in your formulas:
              </p>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>
                  <strong>Attributes:</strong> <code>STR</code>, <code>DEX</code>, <code>INT</code>,{" "}
                  <code>WIL</code>
                </li>
                <li>
                  <strong>Character level:</strong> <code>LEVEL</code> or <code>LVL</code>
                </li>
                <li>
                  <strong>Examples:</strong> <code>1d20+STR</code>, <code>2d6+LEVEL*2</code>,{" "}
                  <code>STRd6+2</code>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Special Notations</h3>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>
                  <strong>!</strong> = Exploding dice (first die rerolls on max)
                </li>
                <li>
                  <strong>!!</strong> = All dice explode (ALL dice reroll on max)
                </li>
                <li>
                  <strong>v</strong> = Vicious (add extra die on critical)
                </li>
                <li>
                  <strong>a</strong> = Advantage (roll extra, keep highest)
                </li>
                <li>
                  <strong>d</strong> = Disadvantage (roll extra, keep lowest)
                </li>
                <li>
                  <strong>Double-digit</strong> = Rolls two dice for tens and ones (d44, d66, d88).
                  Note: Double-digit rolls cannot crit or explode.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Examples</h3>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>
                  <code>2d6+5</code> - Roll 2d6 and add 5
                </li>
                <li>
                  <code>1d20!a</code> - Roll d20 with advantage and exploding crits
                </li>
                <li>
                  <code>4d4!!</code> - Roll 4d4 where ALL 4s explode
                </li>
                <li>
                  <code>3d8v</code> - Roll 3d8 with vicious dice
                </li>
                <li>
                  <code>1d20d2+5</code> - Roll d20 with double disadvantage, add 5
                </li>
                <li>
                  <code>d44a</code> - Roll a d44 with advantage
                </li>
                <li>
                  <code>1d8+STR</code> - Roll d8 and add Strength modifier
                </li>
                <li>
                  <code>LEVELd6</code> - Roll number of d6 equal to character level
                </li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
