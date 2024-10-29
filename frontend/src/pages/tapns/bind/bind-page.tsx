'use client'

import React, {useEffect, useState} from 'react'
import { useRouter } from 'next/router'
import Button from "@/components/ui/button/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import RotatingCoin from "@/pages/tapns/rotating-coin";
import {WalletMultiButton} from "@/components/WalletMultiButton";

export default function BindPage({ params }: { params: { code: string } }) {
  const GO_URL = process.env.NEXT_PUBLIC_GO_URL!
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const {publicKey} = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (publicKey) {
      setAddress(publicKey)
      setError("")
    }
  }, [publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${GO_URL}/tapns/${params.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        setError('Failed to bind address')
        return
      }

      const data = await response.json()
      // check the data has queue prop, and queue is a int, >= 0
      if (data.queue !== undefined && Number.isInteger(data.queue) && data.queue >= 0) {
        router.push(`/tapns/queue/${params.code}?queue=${data.queue}&address=${encodeURIComponent(address)}`)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('An error occurred while binding the address')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 flex justify-center items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="w-48 mx-auto mb-4">
            <RotatingCoin/>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Bind Aleo Address</Label>
                <Input
                  id="address"
                  placeholder="Input Aleo Address"
                  value={address}
                  onChange={(e) => {setAddress(e.target.value);setError("")}}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </form>
        </CardContent>
        <CardFooter>
          {address && address.length > 50 && <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Binding...' : 'Bind Address'}
          </Button>}
          {(!address || address.length <= 50) &&
              <div className={"text-center w-full"}>
                  <div className="w-full justify-center items-center">
                      <span className="px-2"> - OR - </span>
                  </div>
                  <WalletMultiButton className={"w-full justify-center text-center mt-6"}>Connect Wallet</WalletMultiButton>
              </div>}
        </CardFooter>
      </Card>
    </div>
  )
}