<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    /**
     * Get the transactions for this wallet.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Update the wallet balance.
     */
    public function updateBalance(): void
    {
        $credits = $this->transactions()->where('type', 'credit')->sum('amount');
        $debits = $this->transactions()->where('type', 'debit')->sum('amount');

        // Balance is credits minus debits
        $this->balance = $credits - $debits;
        $this->save();
    }

    /**
     * Recalculate balances for all wallets.
     * Helper method you can call from artisan tinker: Wallet::recalculateAll();
     */
    public static function recalculateAll(): void
    {
        static::all()->each(function (self $wallet) {
            $wallet->updateBalance();
        });
    }
}
