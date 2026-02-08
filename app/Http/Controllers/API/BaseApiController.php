<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

abstract class BaseApiController extends Controller
{
    /**
     * Success response format
     */
    protected function successResponse(mixed $data, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Error response format
     */
    protected function errorResponse(string $message, int $code = 500, ?array $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Validation error response
     */
    protected function validationErrorResponse(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return $this->errorResponse($message, 422, $errors);
    }

    /**
     * Not found response
     */
    protected function notFoundResponse(string $resource = 'Resource'): JsonResponse
    {
        return $this->errorResponse("{$resource} not found", 404);
    }

    /**
     * Unauthorized response
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized access'): JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    /**
     * Execute operation with error handling
     */
    protected function executeWithErrorHandling(callable $callback, string $operation, ?string $resourceId = null): JsonResponse
    {
        try {
            return $callback();
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning("{$operation} validation failed", [
                'errors' => $e->errors(),
                'resource_id' => $resourceId,
                'user_id' => auth()->id(),
            ]);

            return $this->validationErrorResponse($e->errors());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning("{$operation} resource not found", [
                'resource_id' => $resourceId,
                'user_id' => auth()->id(),
            ]);

            return $this->notFoundResponse();
        } catch (\Exception $e) {
            Log::error("{$operation} failed", [
                'error' => $e->getMessage(),
                'resource_id' => $resourceId,
                'user_id' => auth()->id(),
            ]);

            return $this->errorResponse(
                config('app.debug') ? $e->getMessage() : 'Internal server error',
                500
            );
        }
    }

    /**
     * Paginate response format
     */
    protected function paginatedResponse($paginator, string $message = 'Success'): JsonResponse
    {
        return $this->successResponse([
            'items' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ], $message);
    }

    /**
     * Validate and sanitize ID parameter
     */
    protected function validateId(string $id): ?int
    {
        $validatedId = filter_var($id, FILTER_VALIDATE_INT);
        return $validatedId ?: null;
    }

    /**
     * Validate per_page parameter
     */
    protected function validatePerPage(mixed $perPage): int
    {
        $value = filter_var($perPage, FILTER_VALIDATE_INT) ?: 10;
        return max(1, min(100, $value));
    }
}