"use client";

import { Check } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for trying out Coding Ducks",
    features: [
      "500k executions/month",
      "Basic support",
      "5 API keys",
      "100ms avg latency",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For professional developers and teams",
    features: [
      "5M executions/month",
      "Priority support",
      "Unlimited API keys",
      "50ms avg latency",
      "Advanced analytics",
      "Custom limits",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large scale applications",
    features: [
      "Unlimited executions",
      "Dedicated support",
      "SLA guarantee",
      "25ms avg latency",
      "Custom integrations",
      "Volume discounts",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] min-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose the perfect plan for your execution needs
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col p-6 ${plan.highlighted
                  ? "border-primary shadow-primary/20 shadow-lg"
                  : ""
                }`}
            >
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {plan.description}
                </p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                disabled={plan.name === "Free"}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
