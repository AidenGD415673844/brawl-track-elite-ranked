import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { CATEGORIES, defaultResponses } from "@/lib/deservedRankEngine";

// 4-step wizard — one step per category, 5 sliders per step.
// Slick, glass-y, animated with framer-motion transitions.
export default function DeservedRankAssessment({ initial, onComplete, onCancel }) {
  const [responses, setResponses] = useState(initial || defaultResponses());
  const [step, setStep] = useState(0);
  const cat = CATEGORIES[step];
  const isLast = step === CATEGORIES.length - 1;

  const setValue = (qid, val) => {
    setResponses((prev) => ({
      ...prev,
      [cat.id]: { ...prev[cat.id], [qid]: val },
    }));
  };

  const next = () => {
    if (isLast) onComplete(responses);
    else setStep((s) => s + 1);
  };
  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
    else onCancel?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="w-full max-w-xl"
      >
        <Card className="bg-card border-border rounded-2xl overflow-hidden">
          {/* Step header */}
          <div
            className="relative p-5 border-b border-border"
            style={{
              background: `linear-gradient(135deg, ${cat.color.from}22, ${cat.color.to}11)`,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${cat.color.from}, ${cat.color.to})`,
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase text-muted-foreground font-display tracking-widest">
                  Step {step + 1} of {CATEGORIES.length}
                </p>
                <h2
                  className="text-xl font-display font-black leading-tight"
                  style={{ color: cat.color.text }}
                >
                  {cat.label}
                </h2>
                <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
              </div>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-2">
              {CATEGORIES.map((c, i) => (
                <div
                  key={c.id}
                  className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted"
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={false}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                    style={{
                      background: `linear-gradient(90deg, ${c.color.from}, ${c.color.to})`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {cat.questions.map((q) => {
                  const val = Number(responses?.[cat.id]?.[q.id] ?? 50);
                  return (
                    <div key={q.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-display text-foreground">
                          {q.label}
                        </label>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-md"
                          style={{
                            background: `${cat.color.from}22`,
                            color: cat.color.text,
                          }}
                        >
                          {val}/100
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={val}
                        onChange={(e) => setValue(q.id, Number(e.target.value))}
                        className="w-full accent-cyan-500 h-2 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${cat.color.from} 0%, ${cat.color.to} ${val}%, hsl(var(--muted)) ${val}%)`,
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Weak</span>
                        <span>Average</span>
                        <span>Elite</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={prev}
              className="rounded-xl border-border bg-card text-foreground hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              onClick={next}
              className="rounded-xl text-white hover:opacity-95"
              style={{
                background: `linear-gradient(90deg, ${cat.color.from}, ${cat.color.to})`,
              }}
            >
              {isLast ? (
                <>
                  <Check className="w-4 h-4 mr-1" /> Reveal my rank
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
