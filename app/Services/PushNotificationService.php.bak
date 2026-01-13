<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    protected $serverKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->serverKey = config('services.firebase.server_key');
        $this->baseUrl = config('services.firebase.api_url', 'https://fcm.googleapis.com/fcm/send');
    }

    /**
     * Send a push notification to a specific device
     */
    public function sendToDevice(string $deviceToken, string $title, string $body, array $data = []): bool
    {
        $payload = [
            'to' => $deviceToken,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => $data,
        ];

        return $this->sendRequest($payload);
    }

    /**
     * Send a push notification to multiple devices
     */
    public function sendToMany(array $deviceTokens, string $title, string $body, array $data = []): bool
    {
        $payload = [
            'registration_ids' => $deviceTokens,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => $data,
        ];

        return $this->sendRequest($payload);
    }

    /**
     * Subscribe user to a topic
     */
    public function subscribeToTopic(string $deviceToken, string $topic): bool
    {
        $url = 'https://iid.googleapis.com/iid/v1:batchAdd';
        
        $payload = [
            'to' => '/topics/' . $topic,
            'registration_tokens' => [$deviceToken],
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Failed to subscribe to topic: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification to a topic
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): bool
    {
        $payload = [
            'to' => '/topics/' . $topic,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => $data,
        ];

        return $this->sendRequest($payload);
    }

    /**
     * Send the HTTP request to Firebase
     */
    protected function sendRequest(array $payload): bool
    {
        try {
            $response = Http::withHeaders([
            'Authorization' => 'key=' . $this->serverKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl, $payload);

        if ($response->successful()) {
            Log::info('Push notification sent successfully', ['response' => $response->json()]);
            return true;
        } else {
            Log::error('Push notification failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;
        }
        } catch (\Exception $e) {
            Log::error('Push notification exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Save push notification token for a user
     */
    public function saveToken(int $userId, string $token, string $deviceType = 'mobile'): void
    {
        // In a real application, you would save this to a database
        // For now, we'll just log it
        Log::info('Saving push notification token', [
            'user_id' => $userId,
            'token' => $token,
            'device_type' => $deviceType,
        ]);
    }
}