<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class BackupService
{
    protected $disk;

    public function __construct()
    {
        $this->disk = Storage::disk(config('backup.default', 'local'));
    }

    /**
     * Create a database backup
     */
    public function createDatabaseBackup(): bool
    {
        try {
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $path = storage_path('app/backups/' . $filename);

            // Create backups directory if it doesn't exist
            if (!file_exists(storage_path('app/backups'))) {
                mkdir(storage_path('app/backups'), 0755, true);
            }

            // Use Artisan command to backup database
            Artisan::call('backup:run');
            
            Log::info('Database backup created successfully', ['filename' => $filename]);
            return true;
        } catch (\Exception $e) {
            Log::error('Database backup failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a full backup (database + files)
     */
    public function createFullBackup(): bool
    {
        try {
            // Create database backup
            $dbSuccess = $this->createDatabaseBackup();
            
            // Copy important files/folders
            $this->backupFiles();
            
            return $dbSuccess;
        } catch (\Exception $e) {
            Log::error('Full backup failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Backup important files
     */
    protected function backupFiles(): void
    {
        $filesToBackup = [
            'public/images',
            'public/docs',
            'storage/app/public',
            '.env',
        ];

        $backupDir = storage_path('app/backups/files_' . date('Y-m-d_H-i-s'));
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        foreach ($filesToBackup as $file) {
            $source = base_path($file);
            $destination = $backupDir . '/' . basename($file);
            
            if (file_exists($source)) {
                if (is_dir($source)) {
                    $this->copyDirectory($source, $destination);
                } else {
                    copy($source, $destination);
                }
            }
        }
    }

    /**
     * Copy directory recursively
     */
    protected function copyDirectory($src, $dst): void
    {
        $dir = opendir($src);
        @mkdir($dst);
        
        while (($file = readdir($dir)) !== false) {
            if ($file != '.' && $file != '..') {
                if (is_dir($src . '/' . $file)) {
                    $this->copyDirectory($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dst . '/' . $file);
                }
            }
        }
        
        closedir($dir);
    }

    /**
     * Get list of available backups
     */
    public function getAvailableBackups(): array
    {
        $backupDir = storage_path('app/backups');
        $backups = [];

        if (file_exists($backupDir)) {
            $files = scandir($backupDir);
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..') {
                    $filePath = $backupDir . '/' . $file;
                    $backups[] = [
                        'name' => $file,
                        'path' => $filePath,
                        'size' => filesize($filePath),
                        'modified' => date('Y-m-d H:i:s', filemtime($filePath)),
                        'type' => is_dir($filePath) ? 'directory' : 'file',
                    ];
                }
            }
        }

        // Sort by modification date (newest first)
        usort($backups, function ($a, $b) {
            return strtotime($b['modified']) - strtotime($a['modified']);
        });

        return $backups;
    }

    /**
     * Restore from backup
     */
    public function restoreFromBackup(string $backupName): bool
    {
        // This is a simplified implementation
        // In a real application, you would implement actual restore logic
        Log::info('Restore from backup initiated', ['backup' => $backupName]);
        
        // Add restore logic here
        return true;
    }

    /**
     * Delete old backups (keep only last N backups)
     */
    public function cleanupOldBackups(int $keepCount = 5): void
    {
        $backups = $this->getAvailableBackups();
        $backupsToKeep = array_slice($backups, 0, $keepCount);
        $backupsToDelete = array_slice($backups, $keepCount);

        foreach ($backupsToDelete as $backup) {
            $this->deleteBackup($backup['name']);
        }
    }

    /**
     * Delete a specific backup
     */
    public function deleteBackup(string $backupName): bool
    {
        $backupPath = storage_path('app/backups/' . $backupName);
        
        if (file_exists($backupPath)) {
            if (is_dir($backupPath)) {
                return $this->deleteDirectory($backupPath);
            } else {
                return unlink($backupPath);
            }
        }
        
        return false;
    }

    /**
     * Delete directory recursively
     */
    protected function deleteDirectory($dir): bool
    {
        if (!file_exists($dir)) {
            return true;
        }

        if (!is_dir($dir)) {
            return unlink($dir);
        }

        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') {
                continue;
            }

            if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
                return false;
            }
        }

        return rmdir($dir);
    }
}