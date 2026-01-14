<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('phone'); // For emergency contacts, allergies, etc.
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('bio'); // For certifications, availability slots, etc.
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('instructions'); // For interactions, storage conditions, etc.
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('description'); // For contact details, operating hours, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });
    }
};