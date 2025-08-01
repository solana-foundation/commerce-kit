'use client';

import React from "react";
import { createSolanaPayRequest } from "@solana-commerce/headless-sdk";
import { Dialog, DialogTrigger, DialogContent, DialogBackdrop, DialogClose } from "../../ui-primitives/src/react";
import { Recipient } from "@solana-commerce/solana-pay";
import BigNumber from "bignumber.js";
import { useSolanaPay } from "./hooks/use-solana-pay";

type PublicKey = string;

export interface SolanaPayButtonProps {
  recipient: PublicKey;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    fontFamily?: string;
  };
}

export function SolanaPayButton({ recipient, theme = {} }: SolanaPayButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button 
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: theme.primaryColor || '#9945FF',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: theme.fontFamily || 'inherit'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = theme.secondaryColor || '#14F195';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = theme.primaryColor || '#9945FF';
          }}
        >
          Tip with Solana
        </button>
      </DialogTrigger>
      
      <DialogContent>
          <DialogBackdrop />
          <div style={{ 
            backgroundColor: theme.backgroundColor || 'white',
            padding: '2rem', 
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            borderRadius: '0.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            zIndex: 10,
            fontFamily: theme.fontFamily || 'inherit'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '1rem',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: theme.textColor || '#111827'
            }}>
              Scan to Pay
            </h2>
            
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '2rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              border: '2px dashed #d1d5db'
            }}>
              <p style={{ margin: 0, color: '#6b7280' }}>QR Code would go here</p>
            </div>
            
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280',
              wordBreak: 'break-all',
              backgroundColor: '#f3f4f6',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1.5rem',
              fontFamily: 'monospace'
            }}>
            </p>
            
            <DialogClose asChild>
              <button 
                style={{ 
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  fontFamily: theme.fontFamily || 'inherit'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.secondaryColor || '#14F195'}20`;
                  e.currentTarget.style.borderColor = theme.secondaryColor || '#14F195';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Close
              </button>
            </DialogClose>
          </div>
        </DialogContent>
    </Dialog>
  );
}