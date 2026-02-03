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
        Schema::create('role_reporting_relationships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supervisor_role_id');
            $table->unsignedBigInteger('subordinate_role_id');
            $table->string('relationship_type')->default('direct'); // direct, indirect, matrix
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('supervisor_role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('subordinate_role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->unique(['supervisor_role_id', 'subordinate_role_id'], 'role_report_sup_sub_unique');
            $table->index(['supervisor_role_id', 'is_active'], 'role_report_sup_active_index');
            $table->index(['subordinate_role_id', 'is_active'], 'role_report_sub_active_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_reporting_relationships');
    }
};
