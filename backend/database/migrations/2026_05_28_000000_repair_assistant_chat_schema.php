<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('chat_conversations')) {
            Schema::create('chat_conversations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
                $table->string('title')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('chat_conversations', function (Blueprint $table) {
                if (! Schema::hasColumn('chat_conversations', 'farm_id')) {
                    $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
                }

                if (! Schema::hasColumn('chat_conversations', 'title')) {
                    $table->string('title')->nullable();
                }

                if (! Schema::hasColumn('chat_conversations', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }

                if (! Schema::hasColumn('chat_conversations', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        if (! Schema::hasTable('chat_messages')) {
            Schema::create('chat_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('chat_conversation_id')->constrained()->cascadeOnDelete();
                $table->string('role');
                $table->text('content');
                $table->json('context_payload')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('chat_messages', function (Blueprint $table) {
            if (! Schema::hasColumn('chat_messages', 'chat_conversation_id')) {
                $table->foreignId('chat_conversation_id')->nullable()->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('chat_messages', 'role')) {
                $table->string('role')->default('assistant');
            }

            if (! Schema::hasColumn('chat_messages', 'content')) {
                $table->text('content')->nullable();
            }

            if (! Schema::hasColumn('chat_messages', 'context_payload')) {
                $table->json('context_payload')->nullable();
            }

            if (! Schema::hasColumn('chat_messages', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (! Schema::hasColumn('chat_messages', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        // Intentionally non-destructive for existing assistant conversations.
    }
};
