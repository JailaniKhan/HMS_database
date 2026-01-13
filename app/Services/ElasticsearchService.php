<?php

namespace App\Services;

use Elastic\Elasticsearch\ClientBuilder;
use Elastic\Elasticsearch\ClientInterface;
use Illuminate\Support\Facades\Log;

class ElasticsearchService
{
    protected $client;

    public function __construct()
    {
        $hosts = [
            env('ELASTICSEARCH_HOST', 'localhost:9200')
        ];

        $this->client = ClientBuilder::create()
            ->setHosts($hosts)
            ->build();
    }

    /**
     * Index a document
     */
    public function indexDocument(string $index, string $id, array $document)
    {
        $params = [
            'index' => $index,
            'id' => $id,
            'body' => $document
        ];

        try {
            return $this->client->index($params);
        } catch (\Exception $e) {
            Log::error('Elasticsearch index error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Search documents
     */
    public function search(string $index, array $query, int $size = 10, int $from = 0)
    {
        $params = [
            'index' => $index,
            'body' => [
                'query' => $query,
                'from' => $from,
                'size' => $size
            ]
        ];

        try {
            return $this->client->search($params);
        } catch (\Exception $e) {
            Log::error('Elasticsearch search error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update a document
     */
    public function updateDocument(string $index, string $id, array $document)
    {
        $params = [
            'index' => $index,
            'id' => $id,
            'body' => [
                'doc' => $document
            ]
        ];

        try {
            return $this->client->update($params);
        } catch (\Exception $e) {
            Log::error('Elasticsearch update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete a document
     */
    public function deleteDocument(string $index, string $id)
    {
        $params = [
            'index' => $index,
            'id' => $id
        ];

        try {
            return $this->client->delete($params);
        } catch (\Exception $e) {
            Log::error('Elasticsearch delete error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create an index with mapping
     */
    public function createIndex(string $index, array $mapping = [])
    {
        $params = [
            'index' => $index
        ];

        if (!empty($mapping)) {
            $params['body'] = $mapping;
        }

        try {
            return $this->client->indices()->create($params);
        } catch (\Exception $e) {
            Log::error('Elasticsearch create index error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Check if index exists
     */
    public function indexExists(string $index): bool
    {
        try {
            $result = $this->client->indices()->exists(['index' => $index]);
            return is_bool($result) ? $result : true; // Simplified return for boolean check
        } catch (\Exception $e) {
            Log::error('Elasticsearch check index exists error: ' . $e->getMessage());
            return false;
        }
    }
}