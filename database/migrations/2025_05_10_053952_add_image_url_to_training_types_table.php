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
        Schema::table('training_types', function (Blueprint $table) {
            // Add image_url column to store the path to uploaded images
            $table->string('image_url')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_types', function (Blueprint $table) {
            // Remove the column if migration is rolled back
            $table->dropColumn('image_url');
        });
    }
};