package EnsEMBL::Web::Configuration::Healthcheck;

use strict;
use warnings;
use base qw(EnsEMBL::Web::Configuration);

sub set_default_action {
  my $self                = shift;
  $self->{_data}{default} = 'Summary';
}

sub global_context { return undef; }
sub ajax_content   { return undef; }
sub local_context  { return $_[0]->_local_context; }
sub local_tools    { return $_[0]->_local_tools; }
sub context_panel  { return undef; }
sub content_panel  { return $_[0]->_content_panel;  }

sub caption { return '';}

sub populate_tree {
  my $self = shift;
  my $hub = $self->hub;
  my $species_defs = $hub->species_defs;

  $self->create_node( 'Summary', "Summary",
    [qw(
      failure_summary EnsEMBL::Admin::Component::Healthcheck::FailureSummary
      session_info    EnsEMBL::Admin::Component::Healthcheck::SessionInfo
    )],
    { 'availability' => 1, 'filters' => [qw(WebAdmin)]}
  );
 $self->create_node( 'DBType', "Details (by DB Type)",
    [qw(
      database_report EnsEMBL::Admin::Component::Healthcheck::Details::DBType
    )],
    { 'availability' => 1, 'filters' => [qw(WebAdmin)]}
  );
 $self->create_node( 'Species', "Details (by Species)",
    [qw(
      species_report EnsEMBL::Admin::Component::Healthcheck::Details::Species
    )],
    { 'availability' => 1, 'filters' => [qw(WebAdmin)]}
  );
 $self->create_node( 'Testcase', "Details (by Testcase)",
    [qw(
      testcase_report EnsEMBL::Admin::Component::Healthcheck::Details::Testcase
    )],
    { 'availability' => 1, 'filters' => [qw(WebAdmin)]}
  );
 $self->create_node( 'Database', "Details (by Database)",
    [qw(
      database_report EnsEMBL::Admin::Component::Healthcheck::Details::Database
    )],
    { 'availability' => 1, 'filters' => [qw(WebAdmin)]}
  );
  $self->create_node( 'DBList', "Database List",
    [qw(
      directory EnsEMBL::Admin::Component::Healthcheck::DatabaseList
    )],
    { 'availability' => 1, 'filters' => [qw(WebAdmin)]}
  );
  $self->create_node( 'UserDirectory', "User Directory",
    [qw(
      directory EnsEMBL::Admin::Component::Healthcheck::UserDirectory
    )],
    { 'availability' => 1, 'filters' => [qw(WebAdmin)]}
  );

  $self->create_node( 'Annotation', '',
    [qw(
      annotation EnsEMBL::Admin::Component::Healthcheck::Annotation
    )],
    { 'no_menu_entry' => 1, 'filters' => [qw(WebAdmin)]}
  );  

  $self->create_node( 'AnnotationSave', '', [],
      { 'command' => 'EnsEMBL::Admin::Command::Healthcheck::Annotation',
         'no_menu_entry' => 1, 'filters' => [qw(WebAdmin)]}
  );
}

1;
                  
